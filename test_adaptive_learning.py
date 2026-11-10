import unittest
import os
import sqlite3
from adaptive_learning import AdaptiveLearning, default_llm_json, words


class TestAdaptiveLearning(unittest.TestCase):
    def setUp(self):
        self.db_name = ":memory:"
        self.engine = AdaptiveLearning(database=self.db_name)
        self.user_id = "test-user-123"
        self.topic = "cardiology"
        self.content = (
            "The left ventricle is the thickest myocardial chamber. "
            "Coronary artery perfusion occurs during diastole due to intramyocardial compression."
        )

    def tearDown(self):
        self.engine.close()

    def test_words_helper(self):
        result = words("Left Ventricle! 120 mmHg, systolic?")
        self.assertIn("left", result)
        self.assertIn("ventricle", result)
        self.assertIn("120", result)
        self.assertIn("mmhg", result)

    def test_add_resource_validation(self):
        with self.assertRaises(ValueError):
            self.engine.add_resource(self.user_id, "", self.content)
        with self.assertRaises(ValueError):
            self.engine.add_resource(self.user_id, self.topic, "   ")
        with self.assertRaises(ValueError):
            self.engine.add_resource(self.user_id, self.topic, "A" * 500_001)

    def test_add_and_approve_resource(self):
        res_id = self.engine.add_resource(self.user_id, self.topic, self.content)
        self.assertTrue(bool(res_id))

        # Initially unapproved
        chunks_unapproved = self.engine.retrieve(self.user_id, self.topic, "ventricle")
        self.assertEqual(len(chunks_unapproved), 0)

        # Approve resource
        self.engine.approve_resource(res_id)

        # Audit entry generated
        audit_row = self.engine.db.execute("SELECT * FROM audit WHERE record_id = ?", (res_id,)).fetchone()
        self.assertIsNotNone(audit_row)
        self.assertEqual(audit_row["action"], "resource_approved")

        # Now retrievable
        chunks = self.engine.retrieve(self.user_id, self.topic, "ventricle")
        self.assertGreater(len(chunks), 0)
        self.assertEqual(chunks[0]["source_id"], res_id)

    def test_learning_plan_and_recording(self):
        # Initial smoothed score: (0 + 1) / (0 + 2) = 0.5
        initial_plan = self.engine.learning_plan(self.user_id, self.topic)
        self.assertEqual(initial_plan["attempts"], 0)
        self.assertEqual(initial_plan["mastery_estimate"], 0.5)
        self.assertEqual(initial_plan["difficulty"], "beginner")
        self.assertTrue(initial_plan["recommend_3d_review"])

        # Record 5 correct answers: mastery = (5 + 1) / (5 + 2) = 6/7 ≈ 0.857
        for _ in range(5):
            self.engine.record_answer(self.user_id, self.topic, True)

        updated_plan = self.engine.learning_plan(self.user_id, self.topic)
        self.assertEqual(updated_plan["attempts"], 5)
        self.assertGreaterEqual(updated_plan["mastery_estimate"], 0.8)
        self.assertEqual(updated_plan["difficulty"], "advanced")
        self.assertFalse(updated_plan["recommend_3d_review"])

    def test_generate_tutor_and_mcq(self):
        res_id = self.engine.add_resource(self.user_id, self.topic, self.content)
        self.engine.approve_resource(res_id)

        # Generate tutor
        tutor_res = self.engine.generate(
            self.user_id, self.topic, "When does coronary perfusion occur?", "tutor", default_llm_json
        )
        self.assertEqual(tutor_res["status"], "ok")
        self.assertIn("answer", tutor_res)
        self.assertIn(res_id, tutor_res["source_ids"])
        self.assertFalse(tutor_res["requires_review"])

        # Generate MCQ
        mcq_res = self.engine.generate(
            self.user_id, self.topic, "coronary perfusion", "mcq", default_llm_json
        )
        self.assertEqual(mcq_res["status"], "ok")
        self.assertEqual(len(mcq_res["options"]), 4)
        self.assertTrue(0 <= mcq_res["correct_index"] < 4)
        self.assertTrue(mcq_res["requires_review"])

    def test_anatomy_labels(self):
        res_id = self.engine.add_resource(self.user_id, self.topic, self.content)
        self.engine.approve_resource(res_id)

        self.engine.add_anatomy_label(
            resource_id=res_id,
            model_id="human-body",
            mesh_name="left_ventricle",
            label="Left Ventricle",
            description="Systemic arterial high pressure pump",
        )

        labels = self.engine.anatomy_labels(self.user_id, "human-body")
        self.assertEqual(len(labels), 1)
        self.assertEqual(labels[0]["mesh_name"], "left_ventricle")
        self.assertEqual(labels[0]["label"], "Left Ventricle")
        self.assertEqual(labels[0]["source_id"], res_id)


if __name__ == "__main__":
    unittest.main()
