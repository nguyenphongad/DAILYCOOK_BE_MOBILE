import React from 'react'
import Header from '../components/Header/Header'
import Menu from '../components/Menu/Menu'

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Menu />
      <div className="layout-container">
        <Header />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout