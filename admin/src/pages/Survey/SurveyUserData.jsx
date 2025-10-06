import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Input, Card, Tabs, Statistic } from 'antd';
import { MdDownload, MdSearch, MdOutlineRemoveRedEye } from 'react-icons/md';
import Loading from '../../components/Loading/Loading';
import '../../styles/pages/SurveyUserData.scss';

const { TabPane } = Tabs;

const SurveyUserData = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    // Giả lập fetch dữ liệu từ API
    setTimeout(() => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        id: `response_${i + 1}`,
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        userName: `Người dùng ${i + 1}`,
        surveyTitle: `Khảo sát ${Math.floor(i / 3) + 1}`,
        completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        deviceType: Math.random() > 0.5 ? 'Mobile' : 'Web',
        timeSpent: Math.floor(Math.random() * 10) + 1, // minutes
      }));
      setUserData(mockData);
      setLoading(false);
    }, 1000);
  };

  // Tính toán thống kê
  const totalResponses = userData.length;
  const uniqueUsers = new Set(userData.map(item => item.userId)).size;
  const uniqueSurveys = new Set(userData.map(item => item.surveyTitle)).size;
  const mobileResponses = userData.filter(item => item.deviceType === 'Mobile').length;
  const webResponses = userData.filter(item => item.deviceType === 'Web').length;
  const avgTimeSpent = userData.length > 0 
    ? userData.reduce((acc, curr) => acc + curr.timeSpent, 0) / userData.length 
    : 0;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'userName',
      key: 'userName',
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: 'Tiêu đề khảo sát',
      dataIndex: 'surveyTitle',
      key: 'surveyTitle',
      sorter: (a, b) => a.surveyTitle.localeCompare(b.surveyTitle),
      filters: Array.from(new Set(userData.map(item => item.surveyTitle))).map(title => ({ text: title, value: title })),
      onFilter: (value, record) => record.surveyTitle === value,
    },
    {
      title: 'Thời gian hoàn thành',
      dataIndex: 'completedAt',
      key: 'completedAt',
      sorter: (a, b) => new Date(a.completedAt) - new Date(b.completedAt),
      render: date => new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
    },
    {
      title: 'Thiết bị',
      dataIndex: 'deviceType',
      key: 'deviceType',
      filters: [
        { text: 'Mobile', value: 'Mobile' },
        { text: 'Web', value: 'Web' },
      ],
      onFilter: (value, record) => record.deviceType === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<MdOutlineRemoveRedEye />}
          onClick={() => message.info(`Xem chi tiết phản hồi: ${record.id}`)}
        />
      ),
    },
  ];

  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredData = userData.filter(
    item => 
      item.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.surveyTitle.toLowerCase().includes(searchText.toLowerCase()) ||
      item.id.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="survey-user-data-page">
      <Loading visible={loading} text="Đang tải dữ liệu..." />

      <div className="page-header">
        <h1>Dữ liệu khảo sát từ người dùng</h1>
        <Button 
          type="primary" 
          icon={<MdDownload />} 
          onClick={() => message.success('Đã xuất dữ liệu thành công!')}
        >
          Xuất dữ liệu
        </Button>
      </div>

      <Tabs defaultActiveKey="responses">
        <TabPane tab="Tổng quan" key="overview">
          <div className="statistics-cards">
            <Card>
              <Statistic title="Tổng số phản hồi" value={totalResponses} />
            </Card>
            <Card>
              <Statistic title="Số người dùng" value={uniqueUsers} />
            </Card>
            <Card>
              <Statistic title="Số khảo sát" value={uniqueSurveys} />
            </Card>
            <Card>
              <Statistic title="Phản hồi từ mobile" value={mobileResponses} suffix={`/ ${totalResponses}`} />
            </Card>
            <Card>
              <Statistic title="Phản hồi từ web" value={webResponses} suffix={`/ ${totalResponses}`} />
            </Card>
            <Card>
              <Statistic title="Thời gian trung bình" value={avgTimeSpent.toFixed(1)} suffix="phút" />
            </Card>
          </div>
        </TabPane>
        
        <TabPane tab="Chi tiết phản hồi" key="responses">
          <div className="table-actions">
            <Input.Search
              placeholder="Tìm kiếm phản hồi..."
              allowClear
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300, marginBottom: 16 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SurveyUserData;
