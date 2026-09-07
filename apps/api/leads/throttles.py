from rest_framework.throttling import AnonRateThrottle


class ConsultationThrottle(AnonRateThrottle):
    scope = "consultation"
