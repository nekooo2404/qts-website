from django.db import models


class Lead(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        QUALIFIED = "qualified", "Qualified"
        WON = "won", "Won"
        LOST = "lost", "Lost"
        SPAM = "spam", "Spam"

    name = models.CharField(max_length=120)
    email = models.EmailField()
    company = models.CharField(max_length=180)
    message = models.TextField()
    phone = models.CharField(max_length=32, blank=True)
    locale = models.CharField(max_length=5, default="vi")
    consent = models.BooleanField(default=False)
    source_url = models.URLField(max_length=500, blank=True)
    utm_source = models.CharField(max_length=120, blank=True)
    utm_medium = models.CharField(max_length=120, blank=True)
    utm_campaign = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.NEW)
    idempotency_key = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"
