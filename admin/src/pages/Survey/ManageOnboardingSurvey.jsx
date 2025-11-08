import React, { useState, useEffect } from 'react';
import { Table, Modal, Select, Input, Space, Tag, Button, Row, Col, Card, Descriptions, Alert, Pagination } from 'antd';
import { SearchOutlined, EyeOutlined, FilterOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import Loading from '../../components/Loading/Loading';
import '../../styles/pages/SurveyPage.scss';

const { Option } = Select;
const { Search } = Input;

const ManageOnboardingSurvey = () => {
  const [userProfiles, setUserProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filters, setFilters] = useState({
    isFamily: undefined,
    isCompleted: undefined,
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Fetch user profiles
  const fetchUserProfiles = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...(filters.isFamily !== undefined && { isFamily: filters.isFamily }),
        ...(filters.isCompleted !== undefined && { isCompleted: filters.isCompleted })
      });

      // Giả lập API call - thay thế bằng API thực tế
      setTimeout(() => {
        const mockData = [
          {
            _id: '1',
            user_id: { _id: '1', name: 'Nguyễn Văn A', email: 'a@example.com' },
            isFamily: false,
            isOnboardingCompleted: true,
            personalInfo: { height: 170, weight: 65, age: 25, gender: 'male' },
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            _id: '2',
            user_id: { _id: '2', name: 'Trần Thị B', email: 'b@example.com' },
            isFamily: true,
            isOnboardingCompleted: false,
            familyInfo: { children: 2, teenagers: 0, adults: 2, elderly: 1 },
            createdAt: '2024-01-14T09:15:00Z'
          }
        ];
        
        setUserProfiles(mockData);
        setPagination(prev => ({
          ...prev,
          total: 50 // Mock total
        }));
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfiles();
  }, [filters, pagination.page]);

  const handleViewDetail = (profile) => {
    setSelectedProfile(profile);
    setIsDetailModalVisible(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      page,
      limit: pageSize
    }));
  };

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.user_id?.name || 'N/A'}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.user_id?.email}</div>
        </div>
      ),
    },
    {
      title: 'Loại hồ sơ',
      dataIndex: 'isFamily',
      key: 'isFamily',
      render: (isFamily) => (
        <Tag icon={isFamily ? <TeamOutlined /> : <UserOutlined />} color={isFamily ? 'blue' : 'green'}>
          {isFamily ? 'Gia đình' : 'Cá nhân'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái hoàn thành',
      dataIndex: 'isOnboardingCompleted',
      key: 'isOnboardingCompleted',
      render: (completed) => (
        <Tag color={completed ? 'success' : 'warning'}>
          {completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewDetail(record)}
          size="small"
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const renderProfileDetail = () => {
    if (!selectedProfile) return null;

    const { personalInfo, familyInfo, dietaryPreferences, nutritionGoals, waterReminders } = selectedProfile;

    return (
      <div>
        <Alert 
          message={`Loại hồ sơ: ${selectedProfile.isFamily ? 'Gia đình' : 'Cá nhân'}`}
          type="info" 
          style={{ marginBottom: 16 }}
        />

        {/* Thông tin cá nhân */}
        {personalInfo && (
          <Card title="Thông tin cá nhân" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Chiều cao">{personalInfo.height} cm</Descriptions.Item>
              <Descriptions.Item label="Cân nặng">{personalInfo.weight} kg</Descriptions.Item>
              <Descriptions.Item label="Tuổi">{personalInfo.age}</Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {personalInfo.gender === 'male' ? 'Nam' : personalInfo.gender === 'female' ? 'Nữ' : 'Khác'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Thông tin gia đình */}
        {familyInfo && (
          <Card title="Thông tin gia đình" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Trẻ em">{familyInfo.children || 0} người</Descriptions.Item>
              <Descriptions.Item label="Thanh thiếu niên">{familyInfo.teenagers || 0} người</Descriptions.Item>
              <Descriptions.Item label="Người lớn">{familyInfo.adults || 0} người</Descriptions.Item>
              <Descriptions.Item label="Người cao tuổi">{familyInfo.elderly || 0} người</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Sở thích ăn uống */}
        {dietaryPreferences && (
          <Card title="Sở thích ăn uống" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Chế độ ăn">{dietaryPreferences.DietType_id}</Descriptions.Item>
              <Descriptions.Item label="Dị ứng">
                {dietaryPreferences.allergies?.join(', ') || 'Không có'}
              </Descriptions.Item>
              <Descriptions.Item label="Không thích">
                {dietaryPreferences.dislikeIngredients?.join(', ') || 'Không có'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Mục tiêu dinh dưỡng */}
        {nutritionGoals && (
          <Card title="Mục tiêu dinh dưỡng" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Calories/ngày">{nutritionGoals.caloriesPerDay}</Descriptions.Item>
              <Descriptions.Item label="Protein">{nutritionGoals.proteinPercentage}%</Descriptions.Item>
              <Descriptions.Item label="Carb">{nutritionGoals.carbPercentage}%</Descriptions.Item>
              <Descriptions.Item label="Chất béo">{nutritionGoals.fatPercentage}%</Descriptions.Item>
              <Descriptions.Item label="Nước/ngày">{nutritionGoals.waterIntakeGoal} ly</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Nhắc nhở uống nước */}
        {waterReminders && (
          <Card title="Nhắc nhở uống nước">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Bật nhắc nhở">
                {waterReminders.enabled ? 'Có' : 'Không'}
              </Descriptions.Item>
              <Descriptions.Item label="Tần suất">{waterReminders.frequency} phút</Descriptions.Item>
              <Descriptions.Item label="Giờ bắt đầu">{waterReminders.startTime}</Descriptions.Item>
              <Descriptions.Item label="Giờ kết thúc">{waterReminders.endTime}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="survey-page">
      <Loading visible={loading} text="Đang tải dữ liệu onboarding..." />
      
      <div className="survey-header">
        <h1>Quản lý Onboarding Survey</h1>
      </div>

      {/* Bộ lọc */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="Tìm kiếm theo tên, email..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => handleFilterChange('search', value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Loại hồ sơ"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('isFamily', value)}
            >
              <Option value={false}>Cá nhân</Option>
              <Option value={true}>Gia đình</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('isCompleted', value)}
            >
              <Option value={true}>Đã hoàn thành</Option>
              <Option value={false}>Chưa hoàn thành</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Bảng dữ liệu */}
      <Table 
        columns={columns}
        dataSource={userProfiles}
        rowKey="_id"
        loading={loading}
        pagination={false}
        className="onboarding-table"
      />

      {/* Phân trang */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Pagination
          current={pagination.page}
          total={pagination.total}
          pageSize={pagination.limit}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) => 
            `${range[0]}-${range[1]} của ${total} hồ sơ onboarding`
          }
        />
      </div>

      {/* Modal chi tiết */}
      <Modal
        title={
          <div>
            <UserOutlined style={{ marginRight: 8 }} />
            Chi tiết Onboarding - {selectedProfile?.user_id?.name}
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
        className="onboarding-detail-modal"
      >
        {renderProfileDetail()}
      </Modal>
    </div>
  );
};

export default ManageOnboardingSurvey;
