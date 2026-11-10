import json
import os
import unittest
from adaptive_learning import AdaptiveLearning, words


class TestAdaptiveLearning(unittest.TestCase):
    def setUp(self):
        self.db_path = f":memory:"
        self.engine = AdaptiveLearning(self.db_path)
        self.user_id = "test_user_001"
        self.topic = "femur_biomechanics"

    def tearDown(self):
        self.engine.close()

    def test_words_extractor(self):
        result = words("Femur bone (Thigh) - Length: 48cm!")
        self.assertIn("femur", result)
        self.assertIn("bone", result)
        self.assertIn("thigh", result)
        self.assertIn("48cm", result)

    def test_add_and_approve_resource(self):
        content = "The femur is the longest and strongest bone in the human body, articulating proximally with the acetabulum."
        res_id = self.engine.add_resource(self.user_id, self.topic, content)
        self.assertTrue(bool(res_id))

        # Before approval, retrieve should return empty
        chunks = self.engine.retrieve(self.user_id, self.topic, "femur bone")
        self.assertEqual(len(chunks), 0)

        # Approve resource
        self.engine.approve_resource(res_id)

        # After approval, retrieve should return the chunk with matching score
        chunks = self.engine.retrieve(self.user_id, self.topic, "femur bone")
        self.assertGreater(len(chunks), 0)
        self.assertEqual(chunks[0]["source_id"], res_id)
        self.assertIn("femur is the longest", chunks[0]["text"])

    def test_add_resource_validation(self):
        with self.assertRaises(ValueError):
            self.engine.add_resource(self.user_id, "", "Some content")

        with self.assertRaises(ValueError):
            self.engine.add_resource(self.user_id, "topic", "   ")

        with self.assertRaises(ValueError):
            self.engine.add_resource(self.user_id, "topic", "x" * 500001)

    def test_approve_nonexistent_resource(self):
        with self.assertRaises(ValueError):
            self.engine.approve_resource("non-existent-id")

    def test_record_answer_and_learning_plan(self):
        initial_plan = self.engine.learning_plan(self.user_id, self.topic)
        self.assertEqual(initial_plan["attempts"], 0)
        self.assertEqual(initial_plan["difficulty"], "beginner")
        self.assertTrue(initial_plan["recommend_3d_review"])

        with self.assertRaises(ValueError):
            self.engine.record_answer(self.user_id, self.topic, "yes")

        for _ in range(5):
            self.engine.record_answer(self.user_id, self.topic, True)

        plan = self.engine.learning_plan(self.user_id, self.topic)
        self.assertEqual(plan["attempts"], 5)
        self.assertEqual(plan["difficulty"], "advanced")
        self.assertFalse(plan["recommend_3d_review"])

    def test_generate_tutor_mode(self):
        content = "The trochanters of the femur serve as insertion points for hip rotators including gluteus medius."
        res_id = self.engine.add_resource(self.user_id, self.topic, content)
        self.engine.approve_resource(res_id)

        def mock_llm_json(system_prompt, payload):
            self.assertIn("trochanters", payload["question"])
            return {
                "status": "ok",
                "source_ids": [res_id],
                "answer": "The greater trochanter serves as the insertion site for the gluteus medius and minimus.",
            }

        result = self.engine.generate(
            self.user_id, self.topic, "What inserts on the trochanters of the femur?", "tutor", mock_llm_json
        )
        self.assertEqual(result["status"], "ok")
        self.assertFalse(result["requires_review"])
        self.assertIn("greater trochanter", result["answer"])

    def test_generate_mcq_mode(self):
        content = "The femoral artery passes through the adductor hiatus into the popliteal fossa."
        res_id = self.engine.add_resource(self.user_id, self.topic, content)
        self.engine.approve_resource(res_id)

        def mock_llm_mcq(system_prompt, payload):
            return {
                "status": "ok",
                "source_ids": [res_id],
                "question": "Which hiatus does the femoral artery traverse to become the popliteal artery?",
                "options": [
                    "Adductor hiatus",
                    "Inguinal canal",
                    "Femoral ring",
                    "Obturator canal",
                ],
                "correct_index": 0,
                "explanation": "The femoral artery traverses the adductor hiatus in the adductor magnus.",
            }

        result = self.engine.generate(
            self.user_id, self.topic, "femoral artery hiatus", "mcq", mock_llm_mcq
        )
        self.assertEqual(result["status"], "ok")
        self.assertTrue(result["requires_review"])
        self.assertEqual(result["correct_index"], 0)
        self.assertEqual(len(result["options"]), 4)

    def test_add_and_query_anatomy_labels(self):
        content = "The head of the femur articulates with the acetabulum of the pelvis."
        res_id = self.engine.add_resource(self.user_id, self.topic, content)
        self.engine.approve_resource(res_id)

        model_id = "skeletal_full"
        mesh_name = "femur_head_mesh"
        label = "Femoral Head"
        desc = "Smooth hemispherical articular surface covered by hyaline cartilage."

        self.engine.add_anatomy_label(res_id, model_id, mesh_name, label, desc)

        labels = self.engine.anatomy_labels(self.user_id, model_id)
        self.assertEqual(len(labels), 1)
        self.assertEqual(labels[0]["mesh_name"], mesh_name)
        self.assertEqual(labels[0]["label"], label)
        self.assertEqual(labels[0]["source_id"], res_id)


if __name__ == "__main__":
    unittest.main()
