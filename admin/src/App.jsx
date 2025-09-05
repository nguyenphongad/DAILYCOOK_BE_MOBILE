import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Login from './pages/Login/Login'
import Home from './pages/Home/Home'
import Users from './pages/Users/Users'
import Menus from './pages/Menus/Menus'
import Dishes from './pages/Dishes/Dishes'
import Ingredients from './pages/Ingredients/Ingredients'
import Products from './pages/Products/Products'
import PrivateRoute from './routes/PrivateRoute'

function App() {
  return (
    <>
    
      <div className="app">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute element={<Home />} />} />
          <Route path="/users" element={<PrivateRoute element={<Users />} />} />
          <Route path="/menus" element={<PrivateRoute element={<Menus />} />} />
          <Route path="/dishes" element={<PrivateRoute element={<Dishes />} />} />
          <Route path="/ingredients" element={<PrivateRoute element={<Ingredients />} />} />
          <Route path="/products" element={<PrivateRoute element={<Products />} />} />
        </Routes>
      </div>
    </>
  )
}

export default App
