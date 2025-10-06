import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Switch, message, Tabs, InputNumber, Divider, Row, Col, Radio } from 'antd';
import { MdEdit, MdDelete, MdAdd, MdDragIndicator } from 'react-icons/md';
import { CloseOutlined } from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import '../../styles/pages/SurveyPage.scss';

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
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const showModal = (survey = null) => {
    setCurrentSurvey(survey);
    form.resetFields();
    
    if (survey) {
      form.setFieldsValue({
        title: survey.title,
        description: survey.description,
        questionType: survey.questionType,
        isActive: survey.isActive,
        isRequired: survey.isRequired || false,
      });
      
      // Load question specific configuration
      if (survey.options) {
        setQuestionOptions(survey.options);
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

  const handleDelete = (id) => {
    // Trong demo, chỉ xóa khảo sát khỏi state
    const updatedSurveys = surveys.filter(item => item.id !== id);
    // Cập nhật lại thứ tự
    const reorderedSurveys = updatedSurveys.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    setSurveys(reorderedSurveys);
    message.success('Xóa khảo sát thành công');
  };

  const handleSubmit = () => {
    setConfirmLoading(true);
    
    form.validateFields().then(values => {
      const updatedValues = {
        ...values,
        timestamp: new Date().toISOString(),
      };
      
      // Add options based on question type
      if (['select', 'radio', 'checkbox'].includes(values.questionType)) {
        updatedValues.options = questionOptions;
      }
      
      // Add text configuration
      if (values.questionType === 'text') {
        updatedValues.textConfig = textConfig;
      }
      
      // Add rating configuration
      if (values.questionType === 'rating') {
        updatedValues.ratingConfig = ratingConfig;
      }

      if (currentSurvey) {
        // Cập nhật khảo sát hiện có
        const updatedSurveys = surveys.map(item => 
          item.id === currentSurvey.id ? { ...item, ...updatedValues } : item
        );
        setSurveys(updatedSurveys);
        message.success('Cập nhật khảo sát thành công');
      } else {
        // Thêm khảo sát mới
        const newSurvey = {
          id: `survey_${Date.now()}`,
          ...updatedValues,
          order: surveys.length + 1,
        };
        setSurveys([...surveys, newSurvey]);
        message.success('Tạo khảo sát mới thành công');
      }

      setIsModalVisible(false);
      form.resetFields();
    }).catch(info => {
      console.log('Validate Failed:', info);
    }).finally(() => {
      setConfirmLoading(false);
    });
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

  const moveRow = (dragIndex, hoverIndex) => {
    const dragRow = surveys[dragIndex];
    const updatedSurveys = update(surveys, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragRow],
      ],
    });
    
    // Cập nhật lại thứ tự
    const reorderedSurveys = updatedSurveys.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    setSurveys(reorderedSurveys);
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
    setLoading(true);
    setTimeout(() => {
      const sampleData = [
        {
          id: 'survey_1',
          title: 'Bạn thường nấu ăn vào thời điểm nào trong ngày?',
          description: 'Tìm hiểu thói quen nấu ăn của người dùng',
          questionType: 'radio',
          isActive: true,
          isRequired: true,
          options: [
            { value: 'morning', label: 'Buổi sáng' },
            { value: 'noon', label: 'Buổi trưa' },
            { value: 'evening', label: 'Buổi tối' },
            { value: 'all', label: 'Cả ngày' }
          ],
          order: 1,
          timestamp: '2023-05-15T09:00:00Z'
        },
        {
          id: 'survey_2',
          title: 'Bạn yêu thích loại món ăn nào nhất?',
          description: 'Xác định sở thích về ẩm thực',
          questionType: 'select',
          isActive: true,
          order: 2,
          timestamp: '2023-04-20T09:00:00Z'
        },
        {
          id: 'survey_3',
          title: 'Bạn có những ý kiến gì để cải thiện ứng dụng?',
          description: 'Thu thập phản hồi người dùng',
          questionType: 'text',
          isActive: false,
          order: 3,
          timestamp: '2023-06-01T09:00:00Z'
        },
        {
          id: 'survey_4',
          title: 'Đánh giá trải nghiệm sử dụng ứng dụng',
          description: 'Đánh giá mức độ hài lòng',
          questionType: 'rating',
          isActive: true,
          order: 4,
          timestamp: '2023-06-10T09:00:00Z'
        },
        {
          id: 'survey_5',
          title: 'Bạn quan tâm đến những tính năng nào?',
          description: 'Xác định nhu cầu người dùng',
          questionType: 'checkbox',
          isActive: true,
          order: 5,
          timestamp: '2023-05-25T09:00:00Z'
        },
        {
          id: 'survey_6',
          title: 'Bạn đánh giá món ăn này bao nhiêu điểm?',
          description: 'Điểm đánh giá từ 1-10',
          questionType: 'text',
          isActive: true,
          isRequired: true,
          textConfig: {
            dataType: 'number',
            minLength: 1,
            maxLength: 2,
            allowEmpty: false,
            placeholder: 'Nhập điểm đánh giá (1-10)',
            minValue: 1,
            maxValue: 10
          },
          order: 6,
          timestamp: '2023-07-01T09:00:00Z'
        },
      ];
      setSurveys([...sampleData]);
      setLoading(false);
    }, 1000);
  }, []);

  const components = {
    body: {
      row: DraggableRow,
    },
  };

  // Render form dựa theo loại câu hỏi
  const renderQuestionValueForm = () => {
    const questionType = form.getFieldValue('questionType');
    
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

  // Initialize options if empty
  useEffect(() => {
    const questionType = form.getFieldValue('questionType');
    if (['select', 'radio', 'checkbox'].includes(questionType) && questionOptions.length === 0) {
      setQuestionOptions([
        { value: 'option_1', label: 'Lựa chọn 1' },
        { value: 'option_2', label: 'Lựa chọn 2' }
      ]);
    }
  }, [form.getFieldValue('questionType')]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="survey-page">
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
          loading={loading}
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
                  handleDelete(currentSurvey.id);
                  setIsModalVisible(false);
                }}
              >
                Xóa
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
          width={900}
          centered
        >
          <Row gutter={24}>
            <Col span={16}>
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
                      onChange={() => {
                        // Reset options when changing question type
                        if (['select', 'radio', 'checkbox'].includes(form.getFieldValue('questionType'))) {
                          setQuestionOptions([
                            { value: 'option_1', label: 'Lựa chọn 1' },
                            { value: 'option_2', label: 'Lựa chọn 2' }
                          ]);
                        }
                      }}
                    >
                      <Option value="text">Nhập text</Option>
                      <Option value="select">Chọn từ danh sách</Option>
                      <Option value="radio">Chọn một</Option>
                      <Option value="checkbox">Chọn nhiều</Option>
                      <Option value="rating">Đánh giá sao</Option>
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
            
            <Col span={8} className="question-value-container">
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