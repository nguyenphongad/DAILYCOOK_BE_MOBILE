import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { checkToken } from './redux/thunks/authThunk'

import LoginPage from './pages/auth/LoginPage'
import Home from './pages/Home/Home'
import Users from './pages/Users/Users'
import Dishes from './pages/Dishes/Dishes'
import DietTypePage from './pages/DietType/DietTypePage'
import PrivateRoute from './routes/PrivateRoute'
import PublicRoute from './routes/PublicRoute'
import Layout from './pages/layout'
import Recipes from './pages/Recipes/Recipes'
import Loading from './components/Loading/Loading'
import Ingredients1 from './pages/Ingredients/Ingredients1'
import ManageIngredient from "./pages/categories/ManageIngredient"
import ManageMeal from './pages/categories/ManageMeal'

function App() {
  const dispatch = useDispatch()
  const { token } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)

  // Kiểm tra token khi ứng dụng khởi động
  useEffect(() => {
    if (token) {
      setIsLoading(true)
      dispatch(checkToken(token)).finally(() => {
        setIsLoading(false)
      })
    }
  }, [dispatch, token])

  return (
    <>
      <Toaster position="bottom-right" closeButton
        toastOptions={{
          style: {
            background: 'black',
            color: 'white',
          },
        }} />
      <Loading visible={isLoading} />
      <Routes>
        <Route path="/login" element={<PublicRoute element={<LoginPage />} restricted={true} />} />
        <Route path="/" element={
          <Layout>
            <PrivateRoute element={<Home />} />
          </Layout>
        } />
        <Route path="/manage_users" element={
          <Layout>
            <PrivateRoute element={<Users />} />
          </Layout>} />
        <Route path="/manage_meal" element={
          <Layout>
            <PrivateRoute element={<Dishes />} />
          </Layout>} />
        <Route path="/manage_ingredients" element={
          <Layout>
            <PrivateRoute element={
              <Ingredients1 />} />
          </Layout>} />
        <Route path="/manage_recipes" element={
          <Layout>
            <PrivateRoute element={<Recipes />} />
          </Layout>} />
        <Route path="/manage_diet-types" element={
          <Layout>
            <PrivateRoute element={<DietTypePage />} />
          </Layout>} />
        
        {/* Thêm routes mới cho các submenu */}
        <Route path="/manage_category/ingredients" element={
          <Layout>
            <PrivateRoute element={<ManageIngredient />} />
          </Layout>} />
        <Route path="/manage_category/meals" element={
          <Layout>
            <PrivateRoute element={<ManageMeal />} />
          </Layout>} />
      </Routes>
    </>
  )
}

export default App
