"""Custom exception classes for MetaPilot AI."""

from fastapi import HTTPException, status


class SecurityException(HTTPException):
    def __init__(self, detail: str = "Security validation failed"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class MetaApprovalRequiredException(HTTPException):
    def __init__(self, detail: str = "Explicit server approval signature required before campaign activation"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ReelSafetyException(HTTPException):
    def __init__(self, detail: str = "Reel preview must be verified and approved prior to publishing"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class TenantIsolationException(HTTPException):
    def __init__(self, detail: str = "Cross-tenant access prohibited"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
