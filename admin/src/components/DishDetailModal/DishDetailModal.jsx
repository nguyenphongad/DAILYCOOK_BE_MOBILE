import React, { useState } from 'react';
import { Modal, Row, Col, Image, Typography, Divider, Descriptions, Tag, Card, List, Steps, Button, Form } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  TeamOutlined, 
  FireOutlined, 
  StarOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import DishForm from '../DishForm/DishForm';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const DishDetailModal = ({ isVisible, onClose, dish, onEdit, onDelete, allIngredients }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  
  if (!dish) return null;
  
  // Dữ liệu mẫu để hiển thị (trong thực tế sẽ lấy từ API)
  const mockIngredients = [
    { id: 1, name: "Thịt gà", amount: "500g" },
    { id: 2, name: "Xả", amount: "3 cây" },
    { id: 3, name: "Ớt", amount: "2 quả" },
    { id: 4, name: "Hành khô", amount: "2 củ" },
    { id: 5, name: "Nước mắm", amount: "2 muỗng canh" },
    { id: 6, name: "Đường", amount: "1 muỗng cà phê" },
    { id: 7, name: "Dầu ăn", amount: "2 muỗng canh" },
    { id: 8, name: "Tỏi", amount: "3 tép" }
  ];
  
  const mockSteps = [
    {
      title: "Sơ chế nguyên liệu",
      content: "Thịt gà rửa sạch, thái miếng vừa ăn. Xả, tỏi, ớt băm nhỏ."
    },
    {
      title: "Ướp thịt",
      content: "Ướp thịt gà với xả, tỏi, ớt, nước mắm, đường trong 15-20 phút."
    },
    {
      title: "Xào thịt",
      content: "Đun nóng dầu, phi thơm hành khô, cho thịt gà vào xào đến khi chín."
    },
    {
      title: "Hoàn thành",
      content: "Nêm nếm lại cho vừa ăn, rắc thêm hành lá, ớt, rau mùi. Dọn ra đĩa."
    }
  ];
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    form.resetFields();
  };
  
  const handleSaveEdit = (values) => {
    if (onEdit) {
      onEdit({ ...values, id: dish.id });
    }
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (onDelete) {
      Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa món ăn này?',
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: () => {
          onDelete(dish.id);
          onClose();
        }
      });
    }
  };
  
  // Nếu đang trong chế độ chỉnh sửa, hiển thị form thay vì thông tin chi tiết
  if (isEditing) {
    return (
      <Modal
        title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chỉnh sửa món ăn</span>}
        open={isVisible}
        onCancel={handleCancelEdit}
        width={1600}
        style={{ 
          top: 10,
          maxWidth: '90%',
          margin: '0 auto'
        }}
        footer={null}
        className="dish-detail-modal editing"
      >
        <DishForm 
          form={form}
          initialValues={dish}
          onFinish={handleSaveEdit}
          onCancel={handleCancelEdit}
          allIngredients={allIngredients || []}
          isEdit={true}
        />
      </Modal>
    );
  }
  
  // Hiển thị thông tin chi tiết món ăn
  return (
    <Modal
      title={<span style={{ fontWeight: 700, fontSize: '18px' }}>Chi tiết món ăn</span>}
      open={isVisible}
      onCancel={onClose}
      width={1600}
      style={{ 
        top: 10,
        maxWidth: '90%',
        margin: '0 auto'
      }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Xóa món ăn
          </Button>
          <div>
            <Button style={{ marginRight: 8 }} onClick={onClose}>
              Đóng
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={handleEditClick}>
              Chỉnh sửa
            </Button>
          </div>
        </div>
      }
      className="dish-detail-modal"
    >
      <Row gutter={24}>
        {/* Phần bên trái (60%) - Thông tin cơ bản và nguyên liệu */}
        <Col span={14}>
          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Thông tin cơ bản</span>} 
            variant="bordered"
          >
            <Row gutter={16}>
              <Col span={10}>
                <div className="dish-image-container">
                  <Image
                    src={dish.image}
                    alt={dish.name}
                    className="dish-image"
                    style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>
              </Col>
              <Col span={14}>
                <Title level={3}>{dish.name}</Title>
                <Tag color="#4CAF50" style={{ marginBottom: 16 }}>{dish.category}</Tag>
                <Paragraph>{dish.description}</Paragraph>
                
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={<strong>Thời gian nấu</strong>}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />{dish.cooking_time}
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Số thành phần</strong>}>
                    {dish.ingredients_count} nguyên liệu
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Khẩu phần</strong>}>
                    <TeamOutlined style={{ marginRight: 8 }} />4 người
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Độ khó</strong>}>
                    <StarOutlined style={{ marginRight: 8 }} />Trung bình
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Calories</strong>}>
                    <FireOutlined style={{ marginRight: 8 }} />~450 kcal/khẩu phần
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Nguyên liệu</span>} 
            variant="bordered"
          >
            <List
              bordered
              dataSource={mockIngredients}
              renderItem={item => (
                <List.Item>
                  <div className="ingredient-item">
                    <CheckCircleOutlined className="check-icon" /> 
                    <span className="ingredient-name">{item.name}</span>
                    <span className="ingredient-amount">{item.amount}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Phần bên phải (40%) - Các bước thực hiện */}
        <Col span={10}>
          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Công thức nấu ăn</span>} 
            variant="bordered"
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: '15px', marginBottom: 16, display: 'block' }}>
                Các bước thực hiện
              </Text>
              <Steps
                direction="vertical"
                size="small"
                current={mockSteps.length}
                className="cooking-steps"
              >
                {mockSteps.map((step, index) => (
                  <Step 
                    key={index}
                    title={<Text strong>{step.title}</Text>}
                    description={<Paragraph>{step.content}</Paragraph>}
                  />
                ))}
              </Steps>
            </div>

            <Divider>
              <span style={{ fontWeight: 600 }}>Thông tin dinh dưỡng</span>
            </Divider>
            
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Calories" variant="bordered">
                  <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                    450 kcal
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Protein" variant="bordered">
                  <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                    30g
                  </div>
                </Card>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small" title="Carbs" variant="bordered">
                  <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                    40g
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Fat" variant="bordered">
                  <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                    15g
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default DishDetailModal;
