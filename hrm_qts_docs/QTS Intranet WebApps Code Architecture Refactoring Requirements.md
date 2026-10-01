# **YÊU CẦU TÁI CẤU TRÚC CODE VÀ KIẾN TRÚC HỆ THỐNG**

Hệ sinh thái ứng dụng Web nội bộ QTS  
Unified Enterprise Management System

Mục tiêu: tái cấu trúc toàn bộ kiến trúc code, source code, module và quy trình phát triển để phù hợp mô hình Enterprise Intranet Web Apps.

# **1\. Bối cảnh và mục tiêu tái cấu trúc**

Sản phẩm hiện tại đã phát triển từ một ứng dụng đơn lẻ thành hệ sinh thái nhiều ứng dụng Web nội bộ doanh nghiệp.

Yêu cầu chuyển đổi:  
\- Từ cách phát triển theo từng chức năng sang kiến trúc theo domain nghiệp vụ.  
\- Code phải dễ đọc, dễ mở rộng, dễ bảo trì.  
\- Fix bug không gây ảnh hưởng module khác.  
\- Không phát sinh code chồng chéo, duplicate logic.  
\- Chuẩn hóa quy trình phát triển cho nhiều team.

# **2\. Định hướng kiến trúc tổng thể**

Áp dụng mô hình Enterprise Modular Architecture.

Định hướng:

Frontend:  
\- Shared Design System.  
\- Shared UI Components.  
\- Application Shell dùng chung.

Backend:  
\- API First.  
\- Domain Driven Design.  
\- Clean Architecture.  
\- Modular Monolith hoặc Microservices theo từng domain phù hợp.

Các module phải độc lập về business logic và có boundary rõ ràng.

# **3\. Nguyên tắc Clean Architecture**

Bắt buộc áp dụng nguyên tắc:

Dependency Rule:  
Business logic không phụ thuộc framework.

Phân lớp:

Domain Layer:  
\- Entity.  
\- Business Rule.

Application Layer:  
\- Use Case.  
\- Service.  
\- DTO.

Infrastructure Layer:  
\- Database.  
\- External API.  
\- File Storage.

Presentation Layer:  
\- Controller.  
\- API Endpoint.

Không được để:  
Controller chứa business logic.  
Database query nằm trực tiếp trong API.  
Frontend gọi trực tiếp database.

# **4\. Cấu trúc Backend Code yêu cầu**

Cấu trúc đề xuất:

backend/

src/

modules/

identity/  
\- authentication  
\- authorization  
\- user

employee/  
\- employee domain  
\- employee service  
\- employee repository

workflow/  
\- approval engine

payroll/  
\- salary calculation

document/  
\- file management

notification/  
\- email notification

audit/  
\- audit logging

shared/  
\- common utilities  
\- exceptions  
\- security

Mỗi module phải tự quản lý:  
\- Controller  
\- Service  
\- Domain  
\- Repository  
\- DTO  
\- Test

# **5\. Không phát triển theo kiểu Layered Monolith truyền thống**

Không sử dụng cấu trúc:

controllers/  
services/  
models/

với toàn bộ hệ thống dùng chung.

Vấn đề:  
\- Module phụ thuộc lẫn nhau.  
\- Fix lỗi dễ gây ảnh hưởng toàn hệ thống.  
\- Khó phân chia team.

Thay thế bằng:  
Feature Module / Domain Module Architecture.

# **6\. Frontend Architecture**

Frontend phải xây dựng theo mô hình Multi Application Platform.

Cấu trúc:

frontend/

apps/

hrm/  
portal/  
document/  
workflow/

packages/

ui/  
\- shared components

auth/  
\- SSO integration

utils/

config/

Yêu cầu:  
\- Component tái sử dụng.  
\- Không copy UI giữa ứng dụng.  
\- State management thống nhất.  
\- API client dùng chung.

# **7\. Quy tắc phát triển API**

API phải:

\- Version hóa.  
\- Có DTO riêng.  
\- Không expose database model.  
\- Có validation.  
\- Có permission check.

Ví dụ:

/api/v1/employees

Không:

/api/getEmployeeRawTable

# **8\. Quy tắc Database Architecture**

Yêu cầu:

\- Mỗi domain sở hữu dữ liệu của mình.  
\- Không query xuyên module trực tiếp.  
\- Sử dụng service interface hoặc API.

Ví dụ:

Payroll không truy cập trực tiếp bảng Employee.

Payroll gọi Employee Service.

# **9\. Error Handling và Debugging**

Bắt buộc:

\- Global exception handler.  
\- Error code chuẩn.  
\- Request ID.  
\- Central logging.

Mỗi lỗi phải truy vết được:

User  
↓  
API  
↓  
Service  
↓  
Database  
↓  
Error Log

# **10\. Logging và Monitoring**

Bắt buộc:

Application Log.  
Audit Log.  
Security Log.  
Performance Log.

Theo dõi:  
\- API latency.  
\- Error rate.  
\- Failed login.  
\- Permission violation.

# **11\. Quy trình Fix Bug và Change Request**

Không sửa trực tiếp production.

Quy trình:

Issue  
↓  
Analysis  
↓  
Create Branch  
↓  
Fix Module  
↓  
Unit Test  
↓  
Code Review  
↓  
Deploy Test  
↓  
Production

Mọi thay đổi phải xác định:  
\- Module ảnh hưởng.  
\- Database migration.  
\- API impact.

# **12\. Testing Requirement**

Bắt buộc:

Unit Test.  
Integration Test.  
API Test.  
Security Test.

Module quan trọng:  
\- Authentication.  
\- Payroll.  
\- Workflow.  
\- Permission.  
\- Document Security.

# **13\. Git Repository Standard**

Yêu cầu:

Branch:

main  
develop  
feature/\*  
bugfix/\*  
release/\*

Commit:

feat:  
fix:  
refactor:  
security:  
docs:

Không commit code lỗi hoặc secret.

# **14\. DevOps và CI/CD**

Pipeline:

Code Commit  
↓  
Build  
↓  
Test  
↓  
Security Scan  
↓  
Deploy Test  
↓  
Approval  
↓  
Production

Bao gồm:  
\- Docker.  
\- Environment separation.  
\- Rollback.

# **15\. Chuẩn hóa kiến trúc cho hệ sinh thái Enterprise**

Các ứng dụng:

HRM  
Portal  
DMS  
Workflow  
ERP  
CRM

phải dùng chung:

\- SSO.  
\- Identity.  
\- Permission.  
\- Notification.  
\- Audit.  
\- Design System.

Nhưng độc lập về business domain.

# **16\. Mục tiêu cuối cùng**

Sau tái cấu trúc:

\- Developer mới có thể đọc code nhanh.  
\- Fix bug trong phạm vi module.  
\- Không tạo lỗi dây chuyền.  
\- Có thể mở rộng thêm ứng dụng mới.  
\- Hỗ trợ nhiều team phát triển song song.  
\- Đủ nền tảng phát triển Enterprise Digital Workplace.