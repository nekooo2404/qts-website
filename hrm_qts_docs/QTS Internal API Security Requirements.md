# **YÊU CẦU PHÁT TRIỂN BẢO MẬT API NỘI BỘ DOANH NGHIỆP**

Hệ thống API nội bộ doanh nghiệp QTS  
Domain: api.qtsgroup.vn

Mục tiêu:  
Xây dựng lớp bảo mật API cấp doanh nghiệp nhằm bảo vệ dữ liệu nội bộ, dữ liệu nhân sự, tài chính, nghiệp vụ và các ứng dụng Web nội bộ trong hệ sinh thái Enterprise.

# **1\. Nguyên tắc bảo mật tổng thể**

Áp dụng mô hình Zero Trust:

\- Không mặc định tin tưởng bất kỳ request nào.  
\- Mọi API phải xác thực và phân quyền.  
\- Kiểm tra quyền ở từng endpoint.  
\- Ghi log toàn bộ truy cập quan trọng.

API phải tuân thủ các thực hành bảo mật API theo OWASP API Security Top 10\.

# **2\. Kiến trúc bảo vệ API**

Kiến trúc bắt buộc:

Client  
 ↓  
WAF  
 ↓  
API Gateway  
 ↓  
Authentication Service (SSO)  
 ↓  
Authorization Service  
 ↓  
Internal API Services  
 ↓  
Database

Không cho phép client truy cập trực tiếp database.

# **3\. HTTPS và Transport Security**

Bắt buộc:

\- Toàn bộ api.qtsgroup.vn sử dụng HTTPS.  
\- TLS phiên bản mới.  
\- Không sử dụng HTTP.  
\- Certificate phải được quản lý tập trung.  
\- Có cơ chế tự động gia hạn SSL.

Các API chứa dữ liệu nhạy cảm phải được mã hóa trên đường truyền.

# **4\. Authentication \- Xác thực API**

Bắt buộc sử dụng:

\- OAuth2 / OpenID Connect.  
\- JWT Access Token.  
\- Refresh Token Rotation.

JWT phải:  
\- Có chữ ký số.  
\- Có thời gian hết hạn.  
\- Có issuer.  
\- Có audience.  
\- Có scope.

Không chấp nhận:  
\- Token không chữ ký.  
\- JWT alg:none.  
\- Token không kiểm tra expiration.

# **5\. Authorization \- Phân quyền API**

Áp dụng:

RBAC:  
\- Role Based Access Control.

Data Scope:  
\- Công ty.  
\- Chi nhánh.  
\- Phòng ban.  
\- Người quản lý.

Field Level Security:  
\- Ẩn trường dữ liệu nhạy cảm.

Ví dụ:  
Nhân viên không được gọi API lấy toàn bộ bảng lương.  
Manager chỉ xem nhân sự thuộc quyền.

# **6\. API Gateway Security**

API Gateway bắt buộc có:

\- Rate Limiting.  
\- Request Validation.  
\- IP Filtering.  
\- API Key Management.  
\- Routing.  
\- Logging.  
\- Threat Detection.

Chống:  
\- Brute Force.  
\- DDoS.  
\- Bot Abuse.  
\- Request bất thường.

# **7\. Input Validation**

Mọi API phải kiểm tra:

\- Kiểu dữ liệu.  
\- Độ dài.  
\- Format.  
\- Schema.

Ngăn chặn:

\- SQL Injection.  
\- NoSQL Injection.  
\- XSS.  
\- Command Injection.  
\- Payload độc hại.

# **8\. Bảo vệ dữ liệu trả về API**

Không trả dữ liệu dư thừa.

Bắt buộc:

\- DTO Response.  
\- Mask dữ liệu nhạy cảm.  
\- Không expose database schema.

Ví dụ:

Không trả:  
CCCD đầy đủ  
Số tài khoản ngân hàng

Nếu không đủ quyền.

# **9\. Audit Log và Monitoring**

Bắt buộc ghi log:

\- User.  
\- IP.  
\- Device.  
\- API endpoint.  
\- Thời gian.  
\- Request ID.  
\- Kết quả.  
\- Dữ liệu thay đổi.

Áp dụng cho:  
\- Xem dữ liệu nhạy cảm.  
\- Thay đổi quyền.  
\- Thay đổi hồ sơ.  
\- Xuất dữ liệu.

# **10\. API Version Management**

Quản lý version:

Ví dụ:

api.qtsgroup.vn/api/v1/  
api.qtsgroup.vn/api/v2/

Yêu cầu:

\- Không xóa API cũ đột ngột.  
\- Có tài liệu API.  
\- Kiểm soát API deprecated.

# **11\. File Upload Security**

Đối với API upload:

Bắt buộc:

\- Kiểm tra extension.  
\- Kiểm tra MIME type.  
\- Scan virus.  
\- Giới hạn dung lượng.  
\- Lưu storage riêng.  
\- Không public URL.

Áp dụng cho:  
\- Hợp đồng.  
\- Hồ sơ nhân sự.  
\- Văn bản doanh nghiệp.

# **12\. Database Security**

API không truy cập database trực tiếp.

Yêu cầu:

\- ORM hoặc parameterized query.  
\- Database account phân quyền tối thiểu.  
\- Encryption dữ liệu nhạy cảm.  
\- Backup có mã hóa.

# **13\. Secrets Management**

Không lưu:

\- Password.  
\- JWT Secret.  
\- Database password.  
\- API Key

trong source code.

Sử dụng:

\- Secret Manager.  
\- Environment Variable.  
\- Vault.

# **14\. CI/CD Security**

Pipeline phải có:

\- Security Scan.  
\- Dependency Scan.  
\- Vulnerability Scan.  
\- Code Review.  
\- Approval trước Production.

# **15\. Penetration Testing**

Trước khi đưa production:

Kiểm thử:

\- Authentication bypass.  
\- Authorization bypass.  
\- JWT attack.  
\- API abuse.  
\- Injection.  
\- Data exposure.

Đánh giá theo OWASP API Security Top 10\.

# **16\. Yêu cầu bắt buộc khi phát triển API QTS**

Checklist:

☑ HTTPS  
☑ OAuth2/OIDC  
☑ JWT Security  
☑ RBAC  
☑ Data Scope  
☑ API Gateway  
☑ Rate Limit  
☑ Validation  
☑ Audit Log  
☑ Encryption  
☑ Monitoring  
☑ Security Testing

Mục tiêu:  
api.qtsgroup.vn trở thành API Gateway an toàn cho toàn bộ hệ sinh thái ứng dụng nội bộ QTS.