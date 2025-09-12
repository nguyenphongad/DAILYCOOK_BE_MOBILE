import React from 'react'
import Header from '../components/Header/Header'
import Menu from '../components/Menu/Menu'

const Layout = ({ children }) => {
    return (
        <div className='container_layout'>
            <Menu />
            <div className='content_area'>
                <Header />
                <div className='main_content' style={{ scrollBehavior: 'smooth' }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Layout