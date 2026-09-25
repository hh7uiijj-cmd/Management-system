import { createContext, useContext, useState } from 'react'

const SidebarContext = createContext(null)

// เก็บสถานะเปิด/ปิดเมนูด้านข้างไว้ตัวเดียวสำหรับทุกหน้า เพื่อให้ปุ่ม hamburger บน Navbar
// ควบคุม Sidebar ได้ แม้แต่ละหน้าจะ render Navbar/Sidebar แยกกันเป็นคนละ instance
export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen((v) => !v)
  const close = () => setIsOpen(false)
  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
