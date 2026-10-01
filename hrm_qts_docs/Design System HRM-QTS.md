# **QTS HRM DESIGN SYSTEM DOCUMENT**

Tài liệu định hướng thiết kế UI/UX cho Fable 5 dựa trên báo cáo Phần mềm quản lý nhân sự HRM \- QTS. Mục tiêu xây dựng giao diện Enterprise HRM bảo mật, hiện đại, hỗ trợ quản trị nhân sự, workflow, ESS, Payroll và SSO.

# **1\. Nguyên tắc thiết kế tổng thể**

Hệ thống là Enterprise HRM, không phải CRUD đơn giản.

Nguyên tắc:  
\- Data First  
\- Security First  
\- Workflow First  
\- Consistency giữa HRM Web App, Portal và Mobile App.

# **2\. Kiến trúc giao diện**

Desktop First.  
Sidebar trái 240px.  
Header quản lý tìm kiếm, thông báo, tài khoản.

Menu: Dashboard, Hồ sơ nhân sự, Cơ cấu tổ chức, Tuyển dụng, Onboarding, Chấm công, Nghỉ phép, Payroll, KPI, Đào tạo, Tài sản, Văn bản nhân sự, Workflow, Báo cáo, ESS, System.

# **3\. Design Token**

Primary: QTS Blue \#2563EB  
Success \#16A34A  
Warning \#F59E0B  
Danger \#DC2626  
Info \#0284C7  
Background \#F8FAFC  
Font Inter.

# **4\. Component Library**

Button, Input, Select, Date Picker, Upload File, Table, Card, Badge, Timeline, Tabs, Modal, Drawer.

Status: Draft, Pending, Approved, Rejected, Active, Expired.

# **5\. Dashboard Design**

Dashboard CEO/HR:  
\- Tổng nhân sự  
\- Biến động nhân sự  
\- Chi phí nhân sự  
\- Chấm công  
\- KPI  
\- Cảnh báo hợp đồng, hồ sơ, BHXH.

# **6\. Employee Profile Design**

Hồ sơ nhân viên là màn hình trung tâm.  
Tabs: Thông tin cá nhân, Công việc, Hợp đồng, Văn bản, Chấm công, Payroll, BHXH, Lịch sử, Audit Log.

# **7\. Document Management UI**

Quản lý HĐLĐ, phụ lục, quyết định tăng lương, bổ nhiệm, nghỉ việc, bằng cấp.  
Yêu cầu: upload Word/PDF, checklist, version, xác minh, mã hóa, phân quyền.

# **8\. Attendance & Workflow UI**

Chấm công gồm check-in, check-out, đi muộn, về sớm, OT, claim.  
Workflow: Employee Submit → Manager Approve → HR Review → Completed.

# **9\. Payroll UI**

Hiển thị kỳ lương, khóa bảng lương, thu nhập, khấu trừ, thực nhận.  
Phiếu lương PDF bảo vệ mật khẩu.

# **10\. SSO Portal Design**

Sau đăng nhập SSO người dùng chọn HRM hoặc Internal Portal. Không đăng nhập lại.

# **11\. Yêu cầu cho Fable 5**

Bám sát nghiệp vụ HRM-QTS. Không thiết kế kiểu marketing SaaS.  
Phong cách Enterprise Software.  
Tham chiếu SAP SuccessFactors \+ Microsoft Fluent UI \+ shadcn/ui.

# **12\. Màn hình cần thiết kế**

1 Login SSO  
2 CEO Dashboard  
3 HR Dashboard  
4 Employee List  
5 Employee Detail  
6 Document Center  
7 Organization Chart  
8 Recruitment  
9 Onboarding  
10 Attendance  
11 Approval Workflow  
12 Leave  
13 Payroll  
14 Payslip  
15 KPI  
16 Asset  
17 Analytics  
18 Permission Management.