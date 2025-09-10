import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'

import LoginPage from './pages/auth/LoginPage'
import Home from './pages/Home/Home'
import Users from './pages/Users/Users'
import Dishes from './pages/Dishes/Dishes'
import Ingredients from './pages/Ingredients/Ingredients'
import PrivateRoute from './routes/PrivateRoute'
import Layout from './pages/layout'
import Recipes from './pages/Recipes/Recipes'

function App() {
  return (
    <>
      <Toaster position="bottom-right" closeButton
        toastOptions={{
          style: {
            background: 'black',
            color: 'white',
          },
        }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <Layout>
            <PrivateRoute element={<Home />} />
          </Layout>
        } />
        <Route path="/users" element={
          <Layout>
            <PrivateRoute element={<Users />} />
          </Layout>} />
        <Route path="/manage_meal" element={
          <Layout>
            <PrivateRoute element={<Dishes />} />
          </Layout>} />
        <Route path="/ingredients" element={
          <Layout>
            <PrivateRoute element={
              <Ingredients />} />
          </Layout>} />
        <Route path="/recipes" element={
          <Layout>
            <PrivateRoute element={<Recipes />} />
          </Layout>} />
      </Routes>
    </>
  )
}

export default App
