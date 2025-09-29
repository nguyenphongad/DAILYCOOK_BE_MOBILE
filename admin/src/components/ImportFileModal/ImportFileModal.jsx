import React, { useState } from 'react';
import { Modal, Upload, Button, Table, Divider, InputNumber, message, Empty, Alert, Spin } from 'antd';
import { InboxOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const ImportFileModal = ({ isVisible, onCancel, onImport }) => {
  const [importFileList, setImportFileList] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [importCount, setImportCount] = useState(20);
  const [fileProcessingStatus, setFileProcessingStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [fileProcessingMessage, setFileProcessingMessage] = useState('');
  
  const handleCancel = () => {
    setImportFileList([]);
    setPreviewData([]);
    setImportCount(20);
    setFileProcessingStatus('idle');
    setFileProcessingMessage('');
    onCancel();
  };
  
  const handleImportUpload = (info) => {
    if (info.file.status === 'removed') {
      setImportFileList([]);
      setPreviewData([]);
      setFileProcessingStatus('idle');
      setFileProcessingMessage('');
      return;
    }
    
    setImportFileList([info.file]);
    setFileProcessingStatus('loading');
    setFileProcessingMessage('Đang đọc dữ liệu từ file...');
    
    if (info.file.originFileObj) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // Kiểm tra nếu có dữ liệu
          if (rows.length > 1 && rows[0].length > 0) {
            const headers = rows[0];
            const preview = [];
            
            // Lấy tối đa 100 dòng để hiển thị
            for (let i = 1; i < Math.min(rows.length, 101); i++) {
              if (rows[i].length > 0) { // Kiểm tra dòng không trống
                const obj = {};
                headers.forEach((header, index) => {
                  if (header) { // Chỉ lấy cột có header
                    obj[header] = rows[i][index];
                  }
                });
                obj.key = i - 1;
                preview.push(obj);
              }
            }
            
            if (preview.length > 0) {
              setPreviewData(preview);
              // Giới hạn importCount không vượt quá số lượng dòng dữ liệu
              setImportCount(Math.min(20, preview.length));
              setFileProcessingStatus('success');
              setFileProcessingMessage(`Đã đọc được ${preview.length} dòng dữ liệu`);
              message.success(`Đã đọc được ${preview.length} dòng dữ liệu`);
            } else {
              setFileProcessingStatus('error');
              setFileProcessingMessage('File không có dữ liệu hợp lệ hoặc cấu trúc không đúng định dạng');
              message.error('Không tìm thấy dữ liệu hợp lệ trong file');
              setPreviewData([]);
            }
          } else {
            setFileProcessingStatus('error');
            setFileProcessingMessage('File không có dữ liệu hoặc cấu trúc không đúng định dạng');
            message.error('File không có dữ liệu hoặc không đúng định dạng');
            setPreviewData([]);
          }
        } catch (error) {
          console.error('Lỗi khi đọc file:', error);
          setFileProcessingStatus('error');
          setFileProcessingMessage('Không thể đọc file. Vui lòng kiểm tra định dạng file có phải Excel hoặc CSV không.');
          message.error('Không thể đọc file. Vui lòng kiểm tra định dạng file.');
          setPreviewData([]);
        }
      };
      
      // Xử lý lỗi đọc file
      reader.onerror = () => {
        setFileProcessingStatus('error');
        setFileProcessingMessage('Đã xảy ra lỗi khi đọc file. Vui lòng thử lại.');
        message.error('Đã xảy ra lỗi khi đọc file. Vui lòng thử lại.');
        setPreviewData([]);
      };
      
      reader.readAsArrayBuffer(info.file.originFileObj);
    }
  };

  const handleImportAll = () => {
    if (previewData.length > 0) {
      onImport(previewData);
      message.success(`Đã import tất cả ${previewData.length} món ăn!`);
      handleCancel();
    } else {
      message.error('Không có dữ liệu để import');
    }
  };

  const handleImportSelected = () => {
    if (previewData.length > 0 && importCount > 0) {
      onImport(previewData.slice(0, importCount));
      message.success(`Đã import ${importCount} món ăn!`);
      handleCancel();
    } else {
      message.error('Không có dữ liệu để import');
    }
  };
  
  // Tạo các cột mẫu cho bảng khi chưa có dữ liệu
  const sampleColumns = [
    { title: 'Tên món ăn', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    { title: 'Thời gian nấu', dataIndex: 'cookingTime', key: 'cookingTime' },
    { title: 'Độ khó', dataIndex: 'difficulty', key: 'difficulty' },
  ];
  
  // Xác định cột cho bảng preview
  const previewColumns = previewData.length > 0 
    ? Object.keys(previewData[0] || {})
        .filter(key => key !== 'key')
        .map(key => ({ 
          title: key, 
          dataIndex: key, 
          key: key,
          ellipsis: true 
        }))
    : sampleColumns;

  // Hiển thị trạng thái xử lý file
  const renderFileProcessingStatus = () => {
    switch (fileProcessingStatus) {
      case 'loading':
        return (
          <div className="processing-status loading">
            <Spin size="small" />
            <span className="status-message">{fileProcessingMessage}</span>
          </div>
        );
      case 'success':
        return (
          <Alert 
            message={fileProcessingMessage} 
            type="success" 
            showIcon 
            className="status-alert"
          />
        );
      case 'error':
        return (
          <Alert 
            message="Lỗi" 
            description={fileProcessingMessage} 
            type="error" 
            showIcon 
            className="status-alert"
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Modal
      title={<span className="modal-title">Import Món Ăn Từ File</span>}
      open={isVisible}
      onCancel={handleCancel}
      width={1200}
      style={{ 
        top: 10,
        maxWidth: '90%',
        margin: '0 auto'
      }}
      footer={null}
      className="import-file-modal"
    >
      <div className="upload-area">
        <Upload.Dragger
          name="file"
          accept=".csv,.xlsx,.xls"
          fileList={importFileList}
          beforeUpload={() => false}
          onChange={handleImportUpload}
          maxCount={1}
          onRemove={() => {
            setImportFileList([]);
            setPreviewData([]);
            setFileProcessingStatus('idle');
            setFileProcessingMessage('');
            return true;
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click hoặc kéo thả file vào khu vực này để tải lên</p>
          <p className="ant-upload-hint">
            Hỗ trợ file CSV, Excel (.xlsx, .xls). Mỗi lần chỉ có thể upload 1 file.
          </p>
        </Upload.Dragger>
      </div>
      
      {/* Hiển thị trạng thái xử lý file */}
      {renderFileProcessingStatus()}
      
      <div className="preview-area">
        <Divider orientation="left">
          <span className="section-title">Xem trước dữ liệu {previewData.length > 0 && `(${previewData.length} dòng)`}</span>
        </Divider>
        
        <div className="preview-table">
          {fileProcessingStatus === 'loading' ? (
            <div className="loading-table">
              <Spin tip="Đang đọc dữ liệu..." />
            </div>
          ) : previewData.length > 0 ? (
            <Table 
              dataSource={previewData.slice(0, 5)} 
              columns={previewColumns}
              size="small"
              pagination={false}
              scroll={{ x: true }}
            />
          ) : (
            <div className="empty-preview-table">
              <Table 
                dataSource={[]}
                columns={previewColumns}
                size="small"
                pagination={false}
                scroll={{ x: true }}
                locale={{
                  emptyText: (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có dữ liệu xem trước. Vui lòng upload file để xem trước dữ liệu."
                    />
                  )
                }}
              />
            </div>
          )}
        </div>
        
        <Divider />
        
        <div className="import-actions">
          <div className="import-counter">
            <span className="counter-label">Số lượng cần thêm:</span>
            <div className="counter-controls">
              <Button 
                icon={<MinusOutlined />} 
                onClick={() => setImportCount(prev => Math.max(1, prev - 1))}
                disabled={importCount <= 1 || previewData.length === 0 || fileProcessingStatus === 'loading'}
              />
              <InputNumber 
                min={1} 
                max={previewData.length > 0 ? previewData.length : 999}
                value={importCount}
                onChange={(value) => setImportCount(value || 1)} 
                className="counter-input"
                disabled={previewData.length === 0 || fileProcessingStatus === 'loading'}
              />
              <Button 
                icon={<PlusOutlined />} 
                onClick={() => setImportCount(prev => Math.min(previewData.length > 0 ? previewData.length : 999, prev + 1))}
                disabled={previewData.length === 0 || (previewData.length > 0 && importCount >= previewData.length) || fileProcessingStatus === 'loading'}
              />
            </div>
          </div>
          
          <div className="action-buttons">
            <Button onClick={handleCancel}>
              Huỷ
            </Button>
            <Button 
              type="primary" 
              onClick={handleImportSelected}
              disabled={previewData.length === 0 || importCount <= 0 || fileProcessingStatus === 'loading'}
              className="import-selected-button"
            >
              Thêm {importCount} món ăn
            </Button>
            <Button 
              type="primary" 
              onClick={handleImportAll}
              disabled={previewData.length === 0 || fileProcessingStatus === 'loading'}
              className="import-all-button"
            >
              Thêm tất cả {previewData.length > 0 ? `(${previewData.length})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImportFileModal;
