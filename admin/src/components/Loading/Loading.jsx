import React from 'react';
import { Spin } from 'antd';
import loadingGif from '../../assets/loading.gif';
import '../../styles/components/Loading.scss';


const Loading = ({ visible = false, useGif = true, text = 'Đang tải...' }) => {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        {useGif ? (
          <img src={loadingGif} alt="Loading" className="loading-gif" />
        ) : (
          <Spin size="large" />
        )}
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

export default Loading;
