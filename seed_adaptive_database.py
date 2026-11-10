from adaptive_learning import AdaptiveLearning

def seed_adaptive_database():
    engine = AdaptiveLearning("learning.db")
    user_id = "default_user"
    topic = "femur"
    content = (
        "The femur is the only bone in the thigh and the longest, strongest bone in the human body. "
        "The head of the femur articulates with the acetabulum of the pelvis, forming the hip joint. "
        "The femoral neck is an angled strut prone to subcapital fractures in elderly osteoporotic patients. "
        "The greater and lesser trochanters serve as mechanical leverage attachment points for hip rotators and flexors. "
        "Distally, the medial and lateral condyles articulate with the tibia and patella at the knee joint."
    )

    try:
        existing = engine.db.execute("SELECT id FROM resources WHERE owner_id = ? AND topic = ?", (user_id, topic)).fetchall()
        if not existing:
            res_id = engine.add_resource(user_id, topic, content)
            engine.approve_resource(res_id)

            engine.add_anatomy_label(
                res_id,
                "human_anatomy",
                "femur",
                "Femur (Thigh Bone)",
                "Longest bone in the human body; transmits axial skeletal load to the knee and leg."
            )
            engine.add_anatomy_label(
                res_id,
                "human_anatomy",
                "heart",
                "Myocardium & Ventricles",
                "High-pressure muscular pump supplying systemic perfusion."
            )
            engine.add_anatomy_label(
                res_id,
                "human_anatomy",
                "lungs",
                "Pulmonary Parenchyma",
                "Site of alveolar-capillary gas exchange with surfactant compliance regulation."
            )
            print(f"Seeded adaptive learning database successfully with resource: {res_id}")
    finally:
        engine.close()

if __name__ == "__main__":
    seed_adaptive_database()
