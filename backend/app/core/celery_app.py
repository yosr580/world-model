from celery import Celery
from app.core.config import settings


celery_app = Celery(
    "world_models",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.inference.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 heure max par tâche
    worker_prefetch_multiplier=1,
    beat_schedule={
        # Exemple : scraping quotidien à 3h du matin
        "daily-scraping": {
            "task": "app.scraping.tasks.run_daily_scraping",
            "schedule": 86400.0,  # 24h en secondes
        },
    },
)


@celery_app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")