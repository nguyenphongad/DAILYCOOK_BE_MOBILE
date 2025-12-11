import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Input, Card, Tabs, Statistic, Modal, Form } from 'antd';
import { MdDownload, MdSearch, MdOutlineRemoveRedEye, MdEdit } from 'react-icons/md';
import Loading from '../../components/Loading/Loading';
import '../../styles/pages/SurveyUserData.scss';
import { useDispatch, useSelector } from 'react-redux';
import { getUserResponses, updateUserResponse } from '../../redux/thunks/surveyThunk';

const { TabPane } = Tabs;
const { TextArea } = Input;

const SurveyUserData = () => {
  const dispatch = useDispatch();
  const { userResponses, loading } = useSelector((state) => state.survey);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(getUserResponses());
  }, [dispatch]);

  const userData = userResponses ? Object.entries(userResponses.responses || {}).map(([key, value], index) => ({
    id: key,
    surveyId: key,
    answer: value,
    responseId: userResponses._id
  })) : [];

  const showEditModal = (record) => {
    setCurrentResponse(record);
    form.setFieldsValue({
      answer: record.answer
    });
    setIsModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(updateUserResponse({
        responseId: currentResponse.responseId,
        responseData: {
          responses: {
            [currentResponse.surveyId]: values.answer
          }
        }
      })).unwrap();
      message.success('Cập nhật câu trả lời thành công');
      setIsModalVisible(false);
      dispatch(getUserResponses());
    } catch (error) {
      message.error(error.message || 'Cập nhật thất bại');
    }
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
      title: 'ID Câu hỏi',
      dataIndex: 'surveyId',
      key: 'surveyId',
      width: 150,
    },
    {
      title: 'Câu trả lời',
      dataIndex: 'answer',
      key: 'answer',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<MdOutlineRemoveRedEye />}
            onClick={() => message.info(`Câu trả lời: ${record.answer}`)}
          />
          <Button
            icon={<MdEdit />}
            onClick={() => showEditModal(record)}
          />
        </Space>
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

      <Modal
        title="Chỉnh sửa câu trả lời"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleUpdate}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="answer"
            label="Câu trả lời"
            rules={[{ required: true, message: 'Vui lòng nhập câu trả lời' }]}
          >
            <TextArea rows={4} placeholder="Nhập câu trả lời của bạn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SurveyUserData;
