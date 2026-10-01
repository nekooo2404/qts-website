# **YÊU CẦU PHÁT TRIỂN HỆ SINH THỐNG ỨNG DỤNG WEB NỘI BỘ DOANH NGHIỆP**

Hệ thống Quản trị Doanh nghiệp Hợp nhất (Unified Enterprise Management System)

Tài liệu định hướng phát triển hệ sinh thái các ứng dụng web nội bộ (Intranet Web Apps) cho doanh nghiệp.

# **1\. Định hướng chiến lược**

Doanh nghiệp không phát triển các phần mềm rời rạc mà xây dựng một hệ sinh thái ứng dụng hợp nhất.

Mục tiêu:  
\- Số hóa toàn bộ hoạt động vận hành nội bộ.  
\- Dùng chung một nền tảng xác thực, phân quyền và dữ liệu.  
\- Giảm dữ liệu trùng lặp giữa các phòng ban.  
\- Tạo một Digital Workplace cho toàn bộ nhân viên.

Mô hình tham chiếu:  
Unified Enterprise Management System / Enterprise Digital Platform.

# **2\. Kiến trúc tổng thể hệ sinh thái**

Kiến trúc gồm các lớp:

1\. Identity Layer:  
\- SSO.  
\- User Management.  
\- RBAC.  
\- Permission.  
\- Employee Identity.

2\. Application Layer:  
Các web application độc lập:  
\- HRM.  
\- Internal Portal.  
\- Document Management.  
\- Workflow Approval.  
\- CRM nội bộ.  
\- ERP Module.  
\- Asset Management.  
\- Knowledge Base.

3\. Integration Layer:  
\- API Gateway.  
\- REST API.  
\- Event Integration.  
\- Notification Service.

4\. Data Layer:  
\- Master Data Management.  
\- Database theo từng domain.  
\- Data Warehouse.

# **3\. Mô hình Application Hub**

Người dùng truy cập thông qua Corporate Portal.

Luồng:

User Login  
↓  
SSO Authentication  
↓  
Application Launcher  
↓  
Chọn ứng dụng:

\[HRM\]  
\[ERP\]  
\[Document\]  
\[Workflow\]  
\[Portal\]

Mỗi ứng dụng có module riêng nhưng dùng chung:  
\- Identity.  
\- User.  
\- Organization.  
\- Permission.

# **4\. Nguyên tắc dữ liệu doanh nghiệp**

Thiết lập Source of Truth.

Ví dụ:

HRM:  
Nguồn dữ liệu gốc về nhân sự.

ERP:  
Nguồn dữ liệu tài chính.

DMS:  
Nguồn dữ liệu văn bản.

SSO:  
Nguồn dữ liệu định danh đăng nhập.

Không cho phép nhiều hệ thống cùng sở hữu một dữ liệu quan trọng.

# **5\. Yêu cầu SSO và Identity Management**

Hệ thống phải hỗ trợ:

\- Single Sign On.  
\- MFA.  
\- User lifecycle management.  
\- Provisioning.  
\- De-provisioning.

Khi nhân viên mới:  
HR tạo hồ sơ → SSO tạo tài khoản → IT cấp email → đồng bộ ngược.

Khi nghỉ việc:  
HR cập nhật trạng thái → khóa tài khoản → thu hồi quyền truy cập.

# **6\. Chuẩn kiến trúc ứng dụng**

Các ứng dụng được phát triển theo mô hình Enterprise Web Application.

Yêu cầu:  
\- Frontend React/Next.js.  
\- Backend API.  
\- Service-oriented architecture.  
\- Container deployment.  
\- CI/CD.  
\- Monitoring.  
\- Logging.

Ứng dụng có thể mở rộng độc lập.

# **7\. Các ứng dụng trong hệ sinh thái đề xuất**

Phase 1:  
\- HRM.  
\- Internal Portal.  
\- SSO.  
\- Document Management.

Phase 2:  
\- Workflow Engine.  
\- Task Management.  
\- Knowledge Management.  
\- Asset Management.

Phase 3:  
\- ERP.  
\- CRM.  
\- BI Analytics.  
\- AI Assistant nội bộ.

# **8\. Design System chung**

Tất cả ứng dụng phải sử dụng cùng một Design System:

\- Logo và brand guideline.  
\- Navigation.  
\- Component library.  
\- Button.  
\- Table.  
\- Form.  
\- Modal.  
\- Notification.  
\- Workflow component.

Mục tiêu:  
Người dùng cảm nhận đây là một hệ thống duy nhất.

# **9\. Security Framework**

Bắt buộc:

\- RBAC.  
\- Data Scope.  
\- Field Level Security.  
\- Audit Log.  
\- Encryption.  
\- Access History.  
\- API Security.

Dữ liệu nhạy cảm:  
\- Lương.  
\- CCCD.  
\- Hồ sơ nhân sự.  
\- Hợp đồng.

Phải giới hạn theo vai trò.

# **10\. Yêu cầu UI/UX cho Fable 5**

Thiết kế theo phong cách:

Enterprise Digital Workplace.

Không sử dụng phong cách:  
\- Landing page.  
\- Marketing website.  
\- Consumer app.

Ưu tiên:  
\- Dashboard.  
\- Data table.  
\- Workflow.  
\- Approval.  
\- Search.  
\- Reporting.

Phong cách tham chiếu:  
Microsoft Fluent UI.  
SAP Enterprise UX.  
shadcn/ui.

# **11\. Mục tiêu cuối cùng**

Xây dựng nền tảng quản trị doanh nghiệp hợp nhất:

Một tài khoản.  
Một hệ sinh thái.  
Một trải nghiệm người dùng.  
Một nền tảng dữ liệu.

Có khả năng mở rộng từ HRM thành Digital Workplace và Enterprise Operating System.