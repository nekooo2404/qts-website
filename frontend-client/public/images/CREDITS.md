# Nguồn ảnh QTS (sử dụng cục bộ)

Tất cả ảnh trong `public/images/` được lưu cục bộ và chỉ dùng để minh hoạ bối cảnh, không hàm ý quan hệ khách hàng hay kết quả.

## Ảnh trang chủ

Giấy phép tham chiếu: [Unsplash License](https://unsplash.com/license) — cho phép sử dụng thương mại, attribution được khuyến khích.

| Tệp cục bộ | Ảnh gốc Unsplash | Giấy phép |
| --- | --- | --- |
| `home/enterprise-operations.jpg` | https://unsplash.com/photos/photo-1552664730-d307ca884978 | https://unsplash.com/license |
| `home/data-collaboration.jpg` | https://unsplash.com/photos/photo-1556761175-b413da4baf72 | https://unsplash.com/license |
| `home/software-work.jpg` | https://unsplash.com/photos/photo-1517245386807-bb43f82c33c4 | https://unsplash.com/license |
| `home/industrial-operations.jpg` | https://unsplash.com/photos/photo-1504917595217-d4dc5ebe6122 | https://unsplash.com/license |
| `home/logistics-warehouse.jpg` | https://unsplash.com/photos/photo-1586528116311-ad8dd3c8310d | https://unsplash.com/license |
| `home/cloud-infrastructure.jpg` | https://unsplash.com/photos/photo-1558494949-ef010cbdcc31 | https://unsplash.com/license |

Ghi chú: ID ảnh `photo-...` tương ứng `https://unsplash.com/photos/<id>`. Nếu cần xác minh nhiếp ảnh gia, tra cứu trực tiếp trên Unsplash. Không sao chép ảnh, sơ đồ hay tài sản từ các trang vendor (Microsoft/AWS/Google Cloud/Salesforce/IBM); mọi tham chiếu tới các nhà xuất bản chỉ là liên kết văn bản tới nguồn chính thức.

## Ảnh trang Ngành (ảnh thực tế, Unsplash License)

Trang `/industries` dùng 6 ảnh chụp thực tế tải cục bộ, mỗi ngành có một bối cảnh riêng. Ảnh không hotlink, không phải ảnh của QTS và không hàm ý quan hệ khách hàng, cơ sở hay kết quả thương mại.

Giấy phép tham chiếu: [Unsplash License](https://unsplash.com/license) — cho phép sử dụng thương mại; attribution được khuyến khích.

| Ngành | Tệp cục bộ | Ảnh gốc Unsplash | Bối cảnh |
| --- | --- | --- | --- |
| Y tế | `industries/healthcare-clinic.jpg` | https://unsplash.com/photos/photo-1586773860418-d37222d8fce3 | Phòng khám và đội ngũ y tế |
| Sản xuất | `industries/manufacturing-line.jpg` | https://unsplash.com/photos/photo-1565610222536-ef125c59da2e | Dây chuyền sản xuất |
| Tài chính | `industries/finance-operations.jpg` | https://unsplash.com/photos/photo-1556761175-b413da4baf72 | Nhóm vận hành và dữ liệu — cùng nguồn với `home/data-collaboration.jpg` (tệp lưu cục bộ trùng byte, ghi nhận minh bạch) |
| Bán lẻ | `industries/retail-store.jpg` | https://unsplash.com/photos/photo-1556742049-0cfed4f6a45d | Điểm bán và giao dịch |
| Giáo dục | `industries/education-classroom.jpg` | https://unsplash.com/photos/photo-1509062522246-3755977927d7 | Lớp học và người học |
| Logistics | `industries/logistics-warehouse.jpg` | https://unsplash.com/photos/photo-1586528116311-ad8dd3c8310d | Kho vận và kiện hàng |

Quy trình vận hành mỗi ngành được trích nguồn chính thức và dẫn link trong thẻ: Bộ Y tế `1313/QĐ-BYT` (y tế), Toyota TPS (sản xuất), BIS PFMI/Basel (tài chính), Shopify (bán lẻ), UNESCO-UIS (giáo dục) và UPS (logistics).

## Ảnh tài nguyên (ảnh thực tế, CC0 1.0)

Các ảnh dưới đây là ảnh thực tế, giấy phép CC0 1.0 (public domain), được lưu cục bộ tại `public/images/resources/`.

| Tệp cục bộ | Tác giả / Nguồn | Ảnh gốc | Giấy phép |
| --- | --- | --- | --- |
| `resources/resource-datacenter-racks.jpg` | D Coetzee — Flickr | https://www.flickr.com/photos/29507259@N02/6271688786 | https://creativecommons.org/publicdomain/zero/1.0/ |
| `resources/resource-office-meeting.jpg` | AMISOM Public Information — Flickr | https://www.flickr.com/photos/61765479@N08/51672902602 | https://creativecommons.org/publicdomain/zero/1.0/ |
| `resources/resource-open-office.jpg` | Wonderlane — Flickr | https://www.flickr.com/photos/71401718@N00/26650832672 | https://creativecommons.org/publicdomain/zero/1.0/ |
| `resources/resource-glass-meeting.jpg` | Wonderlane — Flickr | https://www.flickr.com/photos/71401718@N00/26426854610 | https://creativecommons.org/publicdomain/zero/1.0/ |

Dùng cho các thẻ Tài nguyên nơi trước đây là SVG minh hoạ: Thư viện kiến trúc, Hướng dẫn giải pháp và Theo dõi chủ đề.

## Minh họa vector nội bộ

Các SVG dưới đây là tài sản vector cục bộ trong repo, dùng khi cần tránh lặp ảnh chụp trong các thẻ bằng chứng. Không lấy từ nguồn ảnh bên ngoài và không hàm ý dữ liệu khách hàng.

| Tệp cục bộ | Nguồn | Ghi chú |
| --- | --- | --- |
| `resources/manufacturing-operations.svg` | Minh họa vector nội bộ QTS | Luồng vận hành sản xuất — giao hàng — tài chính |
| `resources/product-update.svg` | Minh họa vector nội bộ QTS | Cập nhật sản phẩm và bề mặt thay đổi |
| `resources/saas-architecture.svg` | Minh họa vector nội bộ QTS | Phạm vi tư vấn nền tảng phần mềm |
| `resources/security-blueprint.svg` | Minh họa vector nội bộ QTS | Bảo mật và kiểm soát truy cập |
| `resources/ai-intelligence.svg` | Minh họa vector nội bộ QTS | Tín hiệu AI và ngoại lệ vận hành |
| `resources/cloud-architecture.svg` | Minh họa vector nội bộ QTS | Kiến trúc đám mây cho lộ trình triển khai |

## Ảnh trang Company (ảnh thực tế, CC0 1.0)

Các ảnh dưới đây là ảnh thực tế, giấy phép CC0 1.0 (public domain), được lưu cục bộ tại `public/images/company/`. Chúng chỉ minh hoạ bối cảnh làm việc doanh nghiệp; không mô tả trụ sở, nhân sự, khách hàng hay quan hệ thương mại của QTS.

| Tệp cục bộ | Tác giả / Nguồn | Ảnh gốc | Giấy phép |
| --- | --- | --- | --- |
| `company/company-hero-open-office.jpg` | City of Seattle FAS — Flickr | https://www.flickr.com/photos/128406945@N06/37904072461 | https://creativecommons.org/publicdomain/zero/1.0/ |
| `company/company-culture-architecture.jpg` | Wallboat — Flickr | https://www.flickr.com/photos/151415985@N06/36648174252 | https://creativecommons.org/publicdomain/zero/1.0/ |
| `company/company-culture-workshop.jpg` | Christina Morillo — StockSnap | https://stocksnap.io/photo/woman-designer-BEHESPSFYR | https://creativecommons.org/publicdomain/zero/1.0/ |
| `company/company-culture-collaboration.jpg` | Wonderlane — Flickr | https://www.flickr.com/photos/71401718@N00/26698440436 | https://creativecommons.org/publicdomain/zero/1.0/ |
| `company/company-culture-product-review.jpg` | Wallboat — Flickr | https://www.flickr.com/photos/151415985@N06/36819065315 | https://creativecommons.org/publicdomain/zero/1.0/ |
