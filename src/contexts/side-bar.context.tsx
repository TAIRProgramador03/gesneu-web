import React, { useState } from 'react'
import { createContext } from "react";

interface SideBarProps {
  collapsed: boolean,
  mobileOpen: boolean,
  handleChangeCollapsed: (value: boolean) => void
  handleChangeMobileOpen: (value: boolean) => void
}

export const SideBarContext = createContext({} as SideBarProps)

export const SideBarProvider = ({ children }: { children: React.ReactNode }) => {

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleChangeCollapsed = (value: boolean) => setCollapsed(value)
  const handleChangeMobileOpen = (value: boolean) => setMobileOpen(value)

  return (
    <SideBarContext.Provider value={{
      collapsed,
      mobileOpen,
      handleChangeCollapsed,
      handleChangeMobileOpen
    }}>
      {children}
    </SideBarContext.Provider>
  )
}


