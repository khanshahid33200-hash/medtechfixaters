from manim import *

class ClinicalOSAd(Scene):
    def construct(self):
        # Colors
        navy = "#0A192F"
        teal = "#00BFA5"
        white = "#FFFFFF"
        self.camera.background_color = navy

        # --- SCENE 1: Chaos to Order (0-4s) ---
        chaos_text = Text("STOP THE CHAOS", font_size=72, color=white).set_weight(BOLD)
        self.play(Write(chaos_text), run_time=1)
        self.play(chaos_text.animate.scale(0.1).set_opacity(0), run_time=1)

        # Tablet representation (Rectangle)
        tablet = RoundedRectangle(corner_radius=0.2, height=4, width=2.5, color=teal, fill_opacity=0.2)
        self.play(FadeIn(tablet, scale=0.5), run_time=1)
        self.wait(1)

        # --- SCENE 2: Streamline Flow (4-8s) ---
        self.play(FadeOut(tablet))
        flow_text = Text("STREAMLINE YOUR FLOW", font_size=60, color=teal).set_weight(BOLD)

        # Simple Isometric representation of a clinic (boxes)
        room1 = Square(side_length=1, color=white).shift(LEFT*3 + UP*1)
        room2 = Square(side_length=1, color=white).shift(LEFT*1 + UP*1)
        room3 = Square(side_length=1, color=white).shift(RIGHT*1 + UP*1)

        dot = Dot(color=teal).shift(LEFT*5)

        self.play(Write(flow_text), run_time=1)
        self.play(Create(room1), Create(room2), Create(room3))

        # Animate "patient" moving through rooms
        self.play(dot.animate.move_to(room1.get_center()), run_time=0.5)
        self.play(dot.animate.move_to(room2.get_center()), run_time=0.5)
        self.play(dot.animate.move_to(room3.get_center()), run_time=0.5)
        self.play(FadeOut(flow_text), FadeOut(room1), FadeOut(room2), FadeOut(room3), FadeOut(dot))

        # --- SCENE 3: Real-time Triage (8-12s) ---
        triage_text = Text("REAL-TIME TRIAGE", font_size=60, color=teal).set_weight(BOLD)

        # Simulated Queue
        q1 = Text("Patient A: Waiting", font_size=30, color=white).shift(UP*1)
        q2 = Text("Patient B: Waiting", font_size=30, color=white).shift(ORIGIN)
        q3 = Text("Patient C: Waiting", font_size=30, color=white).shift(DOWN*1)

        self.play(Write(triage_text), run_time=1)
        self.play(FadeIn(q1), FadeIn(q2), FadeIn(q3))

        # Change status to "In-Consult"
        q1_done = Text("Patient A: IN-CONSULT", font_size=30, color=teal).shift(UP*1)
        self.play(Transform(q1, q1_done), run_time=0.5)
        self.play(FadeOut(triage_text), FadeOut(q1), FadeOut(q2), FadeOut(q3))

        # --- SCENE 4: Logo Reveal (12-20s) ---
        logo_text = Text("CLINICAL OS", font_size=80, color=white).set_weight(BOLD)
        tagline = Text("The Future of Practice", font_size=36, color=teal).next_to(logo_text, DOWN)

        self.play(DrawBorderThenFill(logo_text), run_time=2)
        self.play(FadeIn(tagline, shift=UP), run_time=1)
        self.wait(3)
