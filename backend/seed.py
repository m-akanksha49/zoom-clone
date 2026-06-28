from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

def clear():
    db = SessionLocal()
    db.query(models.Participant).delete()
    db.query(models.Meeting).delete()
    db.commit()
    print("✅ Database cleared!")
    db.close()

clear()