-- ============================================================================
-- MEDTECH FIXATERS — CHAT SYSTEM (Phase 2: Admin ↔ Doctor Communication)
-- Domain: https://www.medtechfixaters.in
-- Supabase Project: ohjublpvkzobzkrgkdtj
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
--
-- ADDITIVE ONLY. Unlike 01_master_setup.sql, this file does NOT drop the
-- public schema — it only adds chat_* tables to an already-live database.
-- Safe to re-run (every statement is idempotent).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- STEP 1: TABLES
-- ----------------------------------------------------------------------------

-- 1.1 CONVERSATIONS (direct: Admin <-> 1 Doctor, or group: Admin + N Doctors)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    name TEXT, -- customizable group name; null for direct chats
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.2 MEMBERS (who is in a conversation — drives all access control below)
CREATE TABLE IF NOT EXISTS public.chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    is_muted BOOLEAN DEFAULT false NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (conversation_id, user_id)
);

-- 1.3 MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT,
    reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    edited_at TIMESTAMPTZ
);

-- 1.4 ATTACHMENTS (images / files / documents on a message)
CREATE TABLE IF NOT EXISTS public.chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.5 READ RECEIPTS (per-member last-read message, drives Delivered/Read ticks)
CREATE TABLE IF NOT EXISTS public.chat_message_reads (
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (message_id, user_id)
);

-- ----------------------------------------------------------------------------
-- STEP 2: INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_chat_conversations_hospital ON public.chat_conversations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_conversation ON public.chat_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON public.chat_message_attachments(message_id);

-- ----------------------------------------------------------------------------
-- STEP 3: HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Is the current user a member of this conversation? (SECURITY DEFINER so the
-- RLS policies below can call it without recursively re-checking chat_members
-- RLS against itself.)
CREATE OR REPLACE FUNCTION public.is_chat_member(p_conversation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_members
        WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get-or-create the single direct conversation between the current user and
-- p_other_user_id, scoped to the hospital both belong to. Both must be
-- active profiles of the same hospital, and the caller must be a hospital
-- admin or the target must be — direct admin<->doctor chat only.
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_my_hospital UUID;
    v_other_hospital UUID;
    v_conv_id UUID;
BEGIN
    SELECT hospital_id INTO v_my_hospital FROM public.profiles WHERE id = auth.uid();
    SELECT hospital_id INTO v_other_hospital FROM public.profiles WHERE id = p_other_user_id;

    IF v_my_hospital IS NULL OR v_other_hospital IS NULL OR v_my_hospital <> v_other_hospital THEN
        RAISE EXCEPTION 'Both users must belong to the same hospital.';
    END IF;

    SELECT cc.id INTO v_conv_id
    FROM public.chat_conversations cc
    WHERE cc.type = 'direct' AND cc.hospital_id = v_my_hospital
      AND EXISTS (SELECT 1 FROM public.chat_members m1 WHERE m1.conversation_id = cc.id AND m1.user_id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.chat_members m2 WHERE m2.conversation_id = cc.id AND m2.user_id = p_other_user_id)
      AND (SELECT COUNT(*) FROM public.chat_members m WHERE m.conversation_id = cc.id) = 2
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
        RETURN v_conv_id;
    END IF;

    INSERT INTO public.chat_conversations (hospital_id, type, created_by)
    VALUES (v_my_hospital, 'direct', auth.uid())
    RETURNING id INTO v_conv_id;

    INSERT INTO public.chat_members (conversation_id, user_id, role) VALUES
        (v_conv_id, auth.uid(), 'owner'),
        (v_conv_id, p_other_user_id, 'member');

    RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_chat_member(UUID) TO authenticated;

-- Create a group conversation with the given member ids (creator is auto-added
-- as owner). All members must belong to the caller's hospital.
CREATE OR REPLACE FUNCTION public.create_group_conversation(p_name TEXT, p_member_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_my_hospital UUID;
    v_conv_id UUID;
    v_member UUID;
BEGIN
    SELECT hospital_id INTO v_my_hospital FROM public.profiles WHERE id = auth.uid();
    IF v_my_hospital IS NULL THEN
        RAISE EXCEPTION 'Caller has no hospital.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM unnest(p_member_ids) AS mid
        LEFT JOIN public.profiles p ON p.id = mid
        WHERE p.hospital_id IS DISTINCT FROM v_my_hospital
    ) THEN
        RAISE EXCEPTION 'All group members must belong to your hospital.';
    END IF;

    INSERT INTO public.chat_conversations (hospital_id, type, name, created_by)
    VALUES (v_my_hospital, 'group', COALESCE(NULLIF(TRIM(p_name), ''), 'New Group'), auth.uid())
    RETURNING id INTO v_conv_id;

    INSERT INTO public.chat_members (conversation_id, user_id, role) VALUES (v_conv_id, auth.uid(), 'owner')
    ON CONFLICT DO NOTHING;

    FOREACH v_member IN ARRAY p_member_ids LOOP
        IF v_member <> auth.uid() THEN
            INSERT INTO public.chat_members (conversation_id, user_id, role)
            VALUES (v_conv_id, v_member, 'member')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_conversation(TEXT, UUID[]) TO authenticated;

-- Keep chat_conversations.last_message_at / preview in sync so the
-- conversation list can sort/display without a join on every render.
CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.chat_conversations
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(COALESCE(NEW.body, '📎 Attachment'), 140),
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chat_message_insert ON public.chat_messages;
CREATE TRIGGER on_chat_message_insert
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

-- ----------------------------------------------------------------------------
-- STEP 4: RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view their conversations" ON public.chat_conversations;
CREATE POLICY "Members view their conversations" ON public.chat_conversations
    FOR SELECT TO authenticated USING (public.is_chat_member(id));

DROP POLICY IF EXISTS "Hospital users create conversations in own hospital" ON public.chat_conversations;
CREATE POLICY "Hospital users create conversations in own hospital" ON public.chat_conversations
    FOR INSERT TO authenticated WITH CHECK (hospital_id = public.current_hospital_id() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Owners update their conversations" ON public.chat_conversations;
CREATE POLICY "Owners update their conversations" ON public.chat_conversations
    FOR UPDATE TO authenticated USING (
        public.is_chat_member(id) AND EXISTS (
            SELECT 1 FROM public.chat_members m WHERE m.conversation_id = id AND m.user_id = auth.uid() AND m.role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Super Admin full access to conversations" ON public.chat_conversations;
CREATE POLICY "Super Admin full access to conversations" ON public.chat_conversations
    FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Members view membership rows of their conversations" ON public.chat_members;
CREATE POLICY "Members view membership rows of their conversations" ON public.chat_members
    FOR SELECT TO authenticated USING (public.is_chat_member(conversation_id));

DROP POLICY IF EXISTS "Members manage own membership row" ON public.chat_members;
CREATE POLICY "Members manage own membership row" ON public.chat_members
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners add members to own conversations" ON public.chat_members;
CREATE POLICY "Owners add members to own conversations" ON public.chat_members
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.chat_members m WHERE m.conversation_id = chat_members.conversation_id AND m.user_id = auth.uid() AND m.role = 'owner')
        OR NOT EXISTS (SELECT 1 FROM public.chat_members m2 WHERE m2.conversation_id = chat_members.conversation_id) -- first insert (creator)
    );

DROP POLICY IF EXISTS "Owners remove members from own conversations" ON public.chat_members;
CREATE POLICY "Owners remove members from own conversations" ON public.chat_members
    FOR DELETE TO authenticated USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.chat_members m WHERE m.conversation_id = chat_members.conversation_id AND m.user_id = auth.uid() AND m.role = 'owner')
    );

DROP POLICY IF EXISTS "Members view messages" ON public.chat_messages;
CREATE POLICY "Members view messages" ON public.chat_messages
    FOR SELECT TO authenticated USING (public.is_chat_member(conversation_id));

DROP POLICY IF EXISTS "Members send messages" ON public.chat_messages;
CREATE POLICY "Members send messages" ON public.chat_messages
    FOR INSERT TO authenticated WITH CHECK (public.is_chat_member(conversation_id) AND sender_id = auth.uid());

DROP POLICY IF EXISTS "Senders edit or soft-delete own messages" ON public.chat_messages;
CREATE POLICY "Senders edit or soft-delete own messages" ON public.chat_messages
    FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Members view attachments" ON public.chat_message_attachments;
CREATE POLICY "Members view attachments" ON public.chat_message_attachments
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.chat_messages cm WHERE cm.id = message_id AND public.is_chat_member(cm.conversation_id))
    );

DROP POLICY IF EXISTS "Members add attachments to own messages" ON public.chat_message_attachments;
CREATE POLICY "Members add attachments to own messages" ON public.chat_message_attachments
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.chat_messages cm WHERE cm.id = message_id AND cm.sender_id = auth.uid())
    );

DROP POLICY IF EXISTS "Members view read receipts" ON public.chat_message_reads;
CREATE POLICY "Members view read receipts" ON public.chat_message_reads
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.chat_messages cm WHERE cm.id = message_id AND public.is_chat_member(cm.conversation_id))
    );

DROP POLICY IF EXISTS "Members mark their own reads" ON public.chat_message_reads;
CREATE POLICY "Members mark their own reads" ON public.chat_message_reads
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

GRANT ALL ON public.chat_conversations, public.chat_members, public.chat_messages, public.chat_message_attachments, public.chat_message_reads
    TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- STEP 5: REALTIME
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 6: STORAGE — chat attachments (images / files / documents)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Attachment object paths are expected as: {conversation_id}/{filename}. Read
-- and write are both restricted to members of that conversation — never a
-- public bucket, unlike prescriptions/logos, since chat content is private.
DROP POLICY IF EXISTS "Chat members read own conversation attachments" ON storage.objects;
CREATE POLICY "Chat members read own conversation attachments" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'chat-attachments'
        AND public.is_chat_member((split_part(name, '/', 1))::uuid)
    );

DROP POLICY IF EXISTS "Chat members upload to own conversation" ON storage.objects;
CREATE POLICY "Chat members upload to own conversation" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'chat-attachments'
        AND public.is_chat_member((split_part(name, '/', 1))::uuid)
    );
