import { IdentityShell } from "@/components/IdentityShell";

export default function Page() {
  const connectionSteps = [
    ["Đăng ký ứng dụng", "Ghi nhận tên ứng dụng, miền sử dụng và người phụ trách vận hành."],
    ["Gán người dùng", "Chỉ tài khoản thuộc đúng tổ chức, vai trò và danh sách được cấp mới thấy ứng dụng."],
    ["Xác minh phiên", "QTS Identity kiểm tra đăng nhập, bảo mật phiên và quyền mở ứng dụng trước khi chuyển tiếp."],
    ["Theo dõi truy cập", "Hoạt động đăng nhập và đăng xuất được ghi nhận tại Trung tâm Định danh để phục vụ rà soát."],
  ];

  return <IdentityShell active="developer"><section className="section"><h1>Kết nối ứng dụng QTS</h1><p className="lead">Trang này dành cho đội quản trị khi đưa một phần mềm vào hệ sinh thái QTS. Người dùng đăng nhập tại QTS Identity, sau đó chỉ nhìn thấy những ứng dụng đã được cấp.</p>
    <div className="panel"><div className="panel-head"><h2>Quy trình kết nối</h2></div>{connectionSteps.map(([name, detail]) => <div className="empty" key={name}><strong>{name}</strong><p>{detail}</p></div>)}</div>
    <p>Phiên truy cập có thời hạn ngắn để giảm rủi ro khi trình duyệt bị bỏ quên. Đăng xuất QTS sẽ đưa người dùng về trang xác nhận và kết thúc quyền truy cập liên quan.</p>
    <p>Khi cần kết nối phần mềm mới, hãy chuẩn bị tên ứng dụng, miền sử dụng, nhóm người dùng được cấp và người phụ trách vận hành để đội định danh kiểm tra trước khi mở quyền.</p>
  </section></IdentityShell>;
}
