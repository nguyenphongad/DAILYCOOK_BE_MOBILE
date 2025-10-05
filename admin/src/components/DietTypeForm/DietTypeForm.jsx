import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Row, Col, Card } from 'antd';
import { UploadOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { uploadImage, convertAntdUploadFileToFile } from '../../utils/cloudinaryUpload';

const { TextArea } = Input;

const DietTypeForm = ({ form, onFinish, onCancel, initialValues, isEdit = false }) => {
  const [imageUrl, setImageUrl] = useState(initialValues?.dietTypeImage || '');
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Hàm xử lý khi submit form
  const handleSubmit = async (values) => {
    try {
      // Nếu có file ảnh mới, upload lên Cloudinary trước
      if (fileList.length > 0) {
        setUploading(true);
        const file = convertAntdUploadFileToFile(fileList[0]);
        
        if (file) {
          const uploadResult = await uploadImage(file, { folder: 'diet-types' });
          values.dietTypeImage = uploadResult.secure_url;
        }
      } else if (imageUrl) {
        // Giữ nguyên URL ảnh cũ nếu không có ảnh mới
        values.dietTypeImage = imageUrl;
      }

      // Gọi callback onFinish với dữ liệu đã có ảnh
      onFinish(values);
    } catch (error) {
      message.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Xử lý thay đổi file
  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Xử lý trước khi upload để preview
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Bạn chỉ có thể tải lên file ảnh!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Kích thước ảnh phải nhỏ hơn 2MB!');
      return false;
    }

    // Tạo URL xem trước
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageUrl(reader.result);
    };

    return false; // Prevent default upload behavior
  };

  // Cấu hình cho Upload component
  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Tải lên</div>
    </div>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        keyword: initialValues?.keyword || '',
        title: initialValues?.title || '',
        description: initialValues?.description || '',
        descriptionDetail: initialValues?.descriptionDetail || '',
        researchSource: initialValues?.researchSource || ''
      }}
    >
      <Row gutter={24}>
        <Col span={16}>
          <Card title="Thông tin chế độ ăn">
            <Form.Item
              name="keyword"
              label="Từ khóa"
              rules={[{ required: true, message: 'Vui lòng nhập từ khóa!' }]}
            >
              <Input placeholder="Nhập từ khóa, ví dụ: keto, vegan..." />
            </Form.Item>

            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
            >
              <Input placeholder="Nhập tiêu đề hiển thị" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả ngắn"
            >
              <TextArea
                rows={3}
                placeholder="Nhập mô tả ngắn về chế độ ăn"
              />
            </Form.Item>

            <Form.Item
              name="descriptionDetail"
              label="Mô tả chi tiết"
            >
              <TextArea
                rows={6}
                placeholder="Nhập mô tả chi tiết về chế độ ăn"
              />
            </Form.Item>

            <Form.Item
              name="researchSource"
              label="Nguồn nghiên cứu"
            >
              <Input placeholder="Nhập nguồn nghiên cứu" />
            </Form.Item>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Hình ảnh">
            <Form.Item label="Ảnh đại diện">
              <Upload
                name="dietTypeImage"
                listType="picture-card"
                showUploadList={true}
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                maxCount={1}
                accept="image/*"
              >
                {fileList.length >= 1 ? null : uploadButton}
              </Upload>
              
              {!fileList.length && imageUrl && (
                <div style={{ marginTop: 16 }}>
                  <p>Ảnh hiện tại:</p>
                  <img 
                    src={imageUrl} 
                    alt="Current" 
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} 
                  />
                </div>
              )}
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Hủy
        </Button>
        <Button type="primary" htmlType="submit" loading={uploading}>
          {isEdit ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </Form>
  );
};

export default DietTypeForm;