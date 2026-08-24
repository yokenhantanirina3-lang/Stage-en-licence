from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "fiscal_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.echeances",
        "app.tasks.pdf_generation",
        "app.tasks.notifications",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Tunis",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "check-echeances-daily": {
            "task": "app.tasks.echeances.check_echeances_daily",
            "schedule": 86400,
        },
    },
)
