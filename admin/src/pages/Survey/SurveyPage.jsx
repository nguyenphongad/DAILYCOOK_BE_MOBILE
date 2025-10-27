import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Switch, message, Tabs, InputNumber, Divider, Row, Col, Radio, Alert } from 'antd';
import { MdEdit, MdDelete, MdAdd, MdDragIndicator } from 'react-icons/md';
import { CloseOutlined } from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import Loading from '../../components/Loading/Loading';
import '../../styles/pages/SurveyPage.scss';
import { useDispatch, useSelector } from 'react-redux';
import { getAllSurveysAdmin, createSurvey, updateSurvey, deleteSurvey } from '../../redux/thunks/surveyThunk';

const { Option } = Select;
const { TextArea } = Input;

const type = 'DraggableRow';

const DraggableRow = ({ index, moveRow, className, style, ...restProps }) => {
  const ref = React.useRef();
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: type,
    collect: (monitor) => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? 'drop-over-downward' : 'drop-over-upward',
      };
    },
    drop: (item) => {
      moveRow(item.index, index);
    },
  });

  const [, drag] = useDrag({
    type,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drop(drag(ref));

  return (
    <tr
      ref={ref}
      className={`${className}${isOver ? ` ${dropClassName}` : ''}`}
      style={{ cursor: 'move', ...style }}
      {...restProps}
    />
  );
};

const SurveyPage = () => {
  const dispatch = useDispatch();
  const { surveys, loading, error } = useSelector((state) => state.survey);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [questionOptions, setQuestionOptions] = useState([]);
  const [textConfig, setTextConfig] = useState({ 
    maxLength: 500, 
    minLength: 0,
    placeholder: 'Nhập câu trả lời của bạn',
    dataType: 'all',
    allowEmpty: false,
    minValue: null,
    maxValue: null
  });
  const [ratingConfig, setRatingConfig] = useState({ maxStars: 5 });
  const [questionType, setQuestionType] = useState('text');
  // Thêm state để quản lý category
  const [selectedCategory, setSelectedCategory] = useState('dietaryPreferences');

  const showModal = (survey = null) => {
    setCurrentSurvey(survey);
    form.resetFields();
    
    if (survey) {
      const surveyQuestionType = survey.questionType || 'text';
      setQuestionType(surveyQuestionType);
      
      form.setFieldsValue({
        title: survey.title,
        description: survey.description,
        questionType: surveyQuestionType,
        category: survey.category,        // Thêm category vào form
        isActive: survey.isActive,
        isRequired: survey.isRequired || false,
      });
      
      // Load question specific configuration
      if (survey.options && ['select', 'radio', 'checkbox'].includes(surveyQuestionType)) {
        setQuestionOptions(survey.options);
      } else if(['select', 'radio', 'checkbox'].includes(surveyQuestionType)) {
        setQuestionOptions([
          { value: 'option_1', label: 'Lựa chọn 1' },
          { value: 'option_2', label: 'Lựa chọn 2' }
        ]);
      } else {
        setQuestionOptions([]);
      }
      
      if (survey.textConfig) {
        setTextConfig({
          maxLength: survey.textConfig.maxLength || 500,
          minLength: survey.textConfig.minLength || 0,
          placeholder: survey.textConfig.placeholder || 'Nhập câu trả lời của bạn',
          dataType: survey.textConfig.dataType || 'all',
          allowEmpty: survey.textConfig.allowEmpty || false,
          minValue: survey.textConfig.minValue || null,
          maxValue: survey.textConfig.maxValue || null
        });
      } else {
        setTextConfig({ 
          maxLength: 500, 
          minLength: 0,
          placeholder: 'Nhập câu trả lời của bạn',
          dataType: 'all',
          allowEmpty: false,
          minValue: null,
          maxValue: null
        });
      }
      
      if (survey.ratingConfig) {
        setRatingConfig(survey.ratingConfig);
      } else {
        setRatingConfig({ maxStars: 5 });
      }
    } else {
      setTextConfig({ 
        maxLength: 500, 
        minLength: 0,
        placeholder: 'Nhập câu trả lời của bạn',
        dataType: 'all',
        allowEmpty: false,
        minValue: null,
        maxValue: null
      });
      setQuestionOptions([]);
      setRatingConfig({ maxStars: 5 });
      form.setFieldsValue({
        isActive: true,
        isRequired: false,
        questionType: 'text',
      });
    }
    
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Sửa lại hàm handleDelete
  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa khảo sát này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await dispatch(deleteSurvey(id)).unwrap();
          message.success('Xóa khảo sát thành công');
          dispatch(getAllSurveysAdmin());
        } catch (error) {
          message.error(error.message || 'Xóa khảo sát thất bại');
        }
      }
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    setConfirmLoading(true);
    try {
      const values = await form.validateFields();
      
      const surveyData = {
        ...values,
        order: currentSurvey ? currentSurvey.order : (surveys.length + 1), // Giữ nguyên order khi update
        options: ['select', 'radio', 'checkbox'].includes(values.questionType) ? questionOptions : undefined,
        textConfig: values.questionType === 'text' ? textConfig : undefined,
        ratingConfig: values.questionType === 'rating' ? ratingConfig : undefined,
      };

      if (currentSurvey) {
        // Update existing survey
        await dispatch(updateSurvey({ 
          id: currentSurvey._id, 
          updateData: {
            ...surveyData,
            _id: currentSurvey._id  // Đảm bảo giữ nguyên _id
          }
        })).unwrap();
        message.success('Cập nhật khảo sát thành công');
      } else {
        // Create new survey
        await dispatch(createSurvey(surveyData)).unwrap();
        message.success('Tạo khảo sát mới thành công');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Thêm option mới
  const addOption = () => {
    const newOption = {
      value: `option_${questionOptions.length + 1}`,
      label: `Lựa chọn ${questionOptions.length + 1}`
    };
    setQuestionOptions([...questionOptions, newOption]);
  };

  // Xóa option
  const removeOption = (index) => {
    const newOptions = [...questionOptions];
    newOptions.splice(index, 1);
    setQuestionOptions(newOptions);
  };

  // Cập nhật option
  const updateOption = (index, field, value) => {
    const newOptions = [...questionOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionOptions(newOptions);
  };

  // Update moveRow function to use new data structure
  const moveRow = (dragIndex, hoverIndex) => {
    const dragRow = surveys[dragIndex];
    const updatedSurveys = update(surveys, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragRow],
      ],
    });
    
    // Update order for each survey
    updatedSurveys.forEach((survey, index) => {
      dispatch(updateSurvey({
        id: survey._id,
        updateData: { ...survey, order: index + 1 }
      }));
    });
  };

  const columns = [
    {
      title: '',
      key: 'sort',
      width: 30,
      className: 'drag-visible',
      render: () => <MdDragIndicator size={20} style={{ cursor: 'grab' }} />,
    },
    {
      title: 'STT',
      dataIndex: 'order',
      key: 'order',
      width: 60,
      render: (order, record) => record.isActive ? order : '-',
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Loại câu hỏi',
      dataIndex: 'questionType',
      key: 'questionType',
      render: (type) => {
        const typeLabels = {
          'text': 'Nhập text',
          'select': 'Chọn từ danh sách',
          'radio': 'Chọn một',
          'checkbox': 'Chọn nhiều',
          'rating': 'Đánh giá sao',
        };
        return typeLabels[type] || type;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <span className={`status-tag ${isActive ? 'status-active' : 'status-inactive'}`}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<MdEdit />} 
          onClick={() => showModal(record)} 
        />
      ),
    },
  ];

  // Tạo dữ liệu mẫu
  useEffect(() => {
    dispatch(getAllSurveysAdmin());
  }, [dispatch]);

  const components = {
    body: {
      row: DraggableRow,
    },
  };

  // Render form dựa theo loại câu hỏi
  const renderQuestionValueForm = () => {
    switch (questionType) {
      case 'text':
        return (
          <div className="question-value-section">
            <h3>Thiết lập câu hỏi văn bản</h3>
            
            <Form.Item label="Kiểu dữ liệu">
              <Radio.Group 
                value={textConfig.dataType}
                onChange={e => {
                  const newDataType = e.target.value;
                  setTextConfig({
                    ...textConfig, 
                    dataType: newDataType,
                    // Reset min/max value khi đổi kiểu dữ liệu
                    minValue: newDataType === 'number' ? 0 : null,
                    maxValue: newDataType === 'number' ? null : null
                  });
                }}
              >
                <Radio value="all">Tất cả</Radio>
                <Radio value="text">Chỉ chữ</Radio>
                <Radio value="number">Chỉ số</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Độ dài tối thiểu">
                  <InputNumber 
                    min={0}
                    max={textConfig.maxLength}
                    value={textConfig.minLength}
                    onChange={value => setTextConfig({...textConfig, minLength: value})}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Độ dài tối đa">
                  <InputNumber 
                    min={textConfig.minLength}
                    max={2000}
                    value={textConfig.maxLength}
                    onChange={value => setTextConfig({...textConfig, maxLength: value})}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            {textConfig.dataType === 'number' && (
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Giá trị nhỏ nhất">
                    <InputNumber 
                      value={textConfig.minValue}
                      onChange={value => setTextConfig({...textConfig, minValue: value})}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Giá trị lớn nhất">
                    <InputNumber 
                      value={textConfig.maxValue}
                      onChange={value => setTextConfig({...textConfig, maxValue: value})}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
            
            <Form.Item label="Placeholder">
              <Input
                value={textConfig.placeholder}
                onChange={e => setTextConfig({...textConfig, placeholder: e.target.value})}
                placeholder="Nhập văn bản gợi ý"
              />
            </Form.Item>
            
            <Form.Item>
              <Switch 
                checked={textConfig.allowEmpty}
                onChange={checked => setTextConfig({...textConfig, allowEmpty: checked})}
                checkedChildren="Cho phép để trống" 
                unCheckedChildren="Không cho phép để trống" 
              />
            </Form.Item>
          </div>
        );
      
      case 'select':
      case 'radio':
      case 'checkbox':
        return (
          <div className="question-value-section">
            <h3>Các lựa chọn</h3>
            <p className="hint">Ít nhất 2 lựa chọn</p>
            
            {questionOptions.map((option, index) => (
              <div key={index} className="option-item">
                <Input
                  value={option.label}
                  onChange={e => updateOption(index, 'label', e.target.value)}
                  placeholder="Nhập nội dung lựa chọn"
                  style={{ width: '85%', marginRight: '8px' }}
                />
                <Button 
                  type="text" 
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => removeOption(index)}
                  disabled={questionOptions.length <= 2}
                />
              </div>
            ))}
            
            <Button 
              type="dashed" 
              onClick={addOption}
              style={{ width: '100%', marginTop: '12px' }}
              icon={<MdAdd />}
            >
              Thêm lựa chọn
            </Button>
          </div>
        );
      
      case 'rating':
        return (
          <div className="question-value-section">
            <h3>Thiết lập đánh giá sao</h3>
            <Form.Item label="Số sao tối đa">
              <InputNumber 
                min={1}
                max={10}
                value={ratingConfig.maxStars}
                onChange={value => setRatingConfig({...ratingConfig, maxStars: value})}
              />
            </Form.Item>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Handler for changing question type
  const handleQuestionTypeChange = (value) => {
    setQuestionType(value);
    
    // Reset options when changing to selection types
    if (['select', 'radio', 'checkbox'].includes(value) && questionOptions.length === 0) {
      setQuestionOptions([
        { value: 'option_1', label: 'Lựa chọn 1' },
        { value: 'option_2', label: 'Lựa chọn 2' }
      ]);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="survey-page">
        <Loading visible={loading} text="Đang tải dữ liệu khảo sát..." />
        
        {error && <Alert message={error} type="error" showIcon />}
        
        <div className="survey-header">
          <h1>Quản lý khảo sát</h1>
          <div className="survey-actions">
            <Button 
              type="primary" 
              icon={<MdAdd />}
              onClick={() => showModal()}
            >
              Tạo khảo sát mới
            </Button>
          </div>
        </div>

        <Table 
          columns={columns}
          dataSource={surveys}
          components={components}
          onRow={(record, index) => ({
            index,
            moveRow,
          })}
          rowKey="id"
          loading={false} // Remove table's built-in loading since we're using our custom Loading component
          pagination={false}
          className="draggable-table"
        />

        <Modal
          title={currentSurvey ? "Chỉnh sửa khảo sát" : "Tạo khảo sát mới"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={[
            currentSurvey && (
              <Button 
                key="delete" 
                danger
                icon={<MdDelete />}
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa khảo sát này không?')) {
                    dispatch(deleteSurvey(currentSurvey._id))
                      .unwrap()
                      .then(() => {
                        message.success('Xóa khảo sát thành công');
                        dispatch(getAllSurveysAdmin());
                        setIsModalVisible(false);
                      })
                      .catch((error) => {
                        message.error(error.message || 'Xóa khảo sát thất bại');
                      });
                  }
                }}
              >
                Xóa khảo sát
              </Button>
            ),
            <Button key="cancel" onClick={handleCancel}>
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={confirmLoading}
              onClick={handleSubmit}
            >
              {currentSurvey ? "Cập nhật" : "Tạo mới"}
            </Button>,
          ]}
          width={1300}
          centered
          className="survey-detail-modal"
        >
          <Loading visible={confirmLoading} text="Đang xử lý..." />
          
          <Row gutter={24}>
            <Col span={15}>
              <div className="question-info-section">
                <h3>Thông tin câu hỏi</h3>
                <Form
                  form={form}
                  layout="vertical"
                  name="survey_form"
                  initialValues={{ isActive: true, isRequired: false, questionType: 'text' }}
                >
                  <Form.Item
                    name="title"
                    label="Tiêu đề câu hỏi"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề câu hỏi!' }]}
                  >
                    <Input placeholder="Nhập tiêu đề câu hỏi" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Mô tả"
                  >
                    <TextArea 
                      placeholder="Nhập mô tả chi tiết về câu hỏi (không bắt buộc)" 
                      rows={3}
                    />
                  </Form.Item>

                  <Form.Item
                    name="questionType"
                    label="Loại câu hỏi"
                    rules={[{ required: true, message: 'Vui lòng chọn loại câu hỏi!' }]}
                  >
                    <Select 
                      placeholder="Chọn loại câu hỏi"
                      onChange={handleQuestionTypeChange}
                    >
                      <Option value="text">Nhập text</Option>
                      <Option value="select">Chọn từ danh sách</Option>
                      <Option value="radio">Chọn một</Option>
                      <Option value="checkbox">Chọn nhiều</Option>
                      <Option value="rating">Đánh giá sao</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="category"
                    label="Loại khảo sát"
                    rules={[{ required: true, message: 'Vui lòng chọn loại khảo sát!' }]}
                  >
                    <Select placeholder="Chọn loại khảo sát">
                      <Option value="personalInfo">Thông tin cá nhân</Option>
                      <Option value="familyInfo">Thông tin gia đình</Option>
                      <Option value="dietaryPreferences">Sở thích ăn uống</Option>
                      <Option value="nutritionGoals">Mục tiêu dinh dưỡng</Option>
                      <Option value="waterReminders">Nhắc nhở uống nước</Option>
                    </Select>
                  </Form.Item>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="isActive"
                        label="Trạng thái"
                        valuePropName="checked"
                      >
                        <Switch 
                          checkedChildren="Hoạt động" 
                          unCheckedChildren="Không hoạt động" 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="isRequired"
                        label="Bắt buộc trả lời"
                        valuePropName="checked"
                      >
                        <Switch 
                          checkedChildren="Có" 
                          unCheckedChildren="Không" 
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>
            </Col>
            
            <Col span={9} className="question-value-container">
              <Divider type="vertical" className="divider-vertical" />
              {renderQuestionValueForm()}
            </Col>
          </Row>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default SurveyPage;