
# Import all models so SQLAlchemy registers them
# before configuring relationships.

from app.modules.auth.models import User
from app.modules.drivers.models import Driver
from app.modules.vehicles.models import Vehicle
from app.modules.sessions.models import DailySession
from app.modules.sessions.records import DailyDriverRecord
from app.modules.payments.models import Payment
from app.modules.notifications.models import Notification
from app.modules.audit.models import AuditLog
from app.modules.settings.models import GarageSettings
