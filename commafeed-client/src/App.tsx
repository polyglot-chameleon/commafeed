import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { ColorScheme, ColorSchemeProvider, MantineProvider } from "@mantine/core"
import { useColorScheme, useLocalStorage } from "@mantine/hooks"
import { ModalsProvider } from "@mantine/modals"
import { NotificationsProvider } from "@mantine/notifications"
import { Constants } from "app/constants"
import { redirectTo } from "app/slices/redirect"
import { reloadServerInfos } from "app/slices/server"
import { useAppDispatch, useAppSelector } from "app/store"
import { categoryUnreadCount } from "app/utils"
import { ErrorBoundary } from "components/ErrorBoundary"
import { Header } from "components/header/Header"
import { Tree } from "components/sidebar/Tree"
import { useI18n } from "i18n"
import { AdminUsersPage } from "pages/admin/AdminUsersPage"
import { MetricsPage } from "pages/admin/MetricsPage"
import { AboutPage } from "pages/app/AboutPage"
import { AddPage } from "pages/app/AddPage"
import { CategoryDetailsPage } from "pages/app/CategoryDetailsPage"
import { FeedDetailsPage } from "pages/app/FeedDetailsPage"
import { FeedEntriesPage } from "pages/app/FeedEntriesPage"
import Layout from "pages/app/Layout"
import { SettingsPage } from "pages/app/SettingsPage"
import { LoginPage } from "pages/auth/LoginPage"
import { PasswordRecoveryPage } from "pages/auth/PasswordRecoveryPage"
import { RegistrationPage } from "pages/auth/RegistrationPage"
import React, { useEffect } from "react"
import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"
import Tinycon from "tinycon"

function Providers(props: { children: React.ReactNode }) {
    const preferredColorScheme = useColorScheme()
    const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
        key: "color-scheme",
        defaultValue: preferredColorScheme,
        getInitialValueInEffect: true,
    })
    const toggleColorScheme = (value?: ColorScheme) => setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"))

    return (
        <I18nProvider i18n={i18n}>
            <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
                <MantineProvider
                    withGlobalStyles
                    withNormalizeCSS
                    theme={{
                        primaryColor: "orange",
                        colorScheme,
                        fontFamily: "Open Sans",
                    }}
                >
                    <ModalsProvider>
                        <NotificationsProvider position="top-center" zIndex={9999}>
                            <ErrorBoundary>{props.children}</ErrorBoundary>
                        </NotificationsProvider>
                    </ModalsProvider>
                </MantineProvider>
            </ColorSchemeProvider>
        </I18nProvider>
    )
}

// swagger-ui is very large, load only on-demand
const ApiDocumentationPage = React.lazy(() => import("pages/app/ApiDocumentationPage"))

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to={`/app/category/${Constants.categories.all.id}`} replace />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegistrationPage />} />
            <Route path="passwordRecovery" element={<PasswordRecoveryPage />} />
            <Route path="app" element={<Layout header={<Header />} sidebar={<Tree />} />}>
                <Route path="category">
                    <Route path=":id" element={<FeedEntriesPage sourceType="category" />} />
                    <Route path=":id/details" element={<CategoryDetailsPage />} />
                </Route>
                <Route path="feed">
                    <Route path=":id" element={<FeedEntriesPage sourceType="feed" />} />
                    <Route path=":id/details" element={<FeedDetailsPage />} />
                </Route>
                <Route path="add" element={<AddPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin">
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="metrics" element={<MetricsPage />} />
                </Route>
                <Route path="about" element={<AboutPage />} />
                <Route path="api" element={<ApiDocumentationPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

function RedirectHandler() {
    const target = useAppSelector(state => state.redirect.to)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    useEffect(() => {
        if (target) {
            // pages can subscribe to state.timestamp in order to refresh when navigating to an url matching the current page
            navigate(target, { state: { timestamp: new Date() } })
            dispatch(redirectTo(undefined))
        }
    }, [target, dispatch, navigate])

    return null
}

function FaviconHandler() {
    const root = useAppSelector(state => state.tree.rootCategory)
    useEffect(() => {
        const unreadCount = categoryUnreadCount(root)
        if (unreadCount === 0) Tinycon.reset()
        else Tinycon.setBubble(unreadCount)
    }, [root])

    return null
}

export function App() {
    useI18n()
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(reloadServerInfos())
    }, [dispatch])

    return (
        <Providers>
            <>
                <FaviconHandler />
                <HashRouter>
                    <RedirectHandler />
                    <AppRoutes />
                </HashRouter>
            </>
        </Providers>
    )
}
