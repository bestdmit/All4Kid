import { useState } from "react";
import { Layout, Button, Typography, Drawer } from "antd";
import { MenuOutlined } from "@ant-design/icons";
const { Header } = Layout;
import { Link } from 'react-router-dom';
const {Title} = Typography;
import styles from './appHeader.module.css';
import { useAuth } from "../../hooks/useAuth";
function AppHeader() {
  const { user, isAuthenticated} = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <Header className={styles.header}>
      <Title className={styles.title}>
        <Link to="/">All4kid</Link>
      </Title>
      <div className={styles.buttonBlock}>
        <Button  type="text" size="large">
          <Link to="/">Главная</Link>
        </Button>
        <Button type="text" size="large">
          <Link to="/create">Создать</Link>
        </Button>
        <Button type="text" size="large">
          <Link to="/specialists">Специалисты</Link>
        </Button>
        {isAuthenticated && user ? 
          (<Button type="text" size="large">
            <Link to="/profile">Профиль</Link>
            </Button>):
          <Button type="text" size="large">
            <Link to="/auth">Вход</Link>
          </Button>
        }
      </div>
      <Button
        className={styles.burgerButton}
        type="text"
        icon={<MenuOutlined />}
        onClick={() => setIsMenuOpen(true)}
        aria-label="Открыть меню"
      />
      <Drawer
        title="Меню"
        placement="right"
        onClose={closeMenu}
        open={isMenuOpen}
      >
        <div className={styles.mobileMenu}>
          <Button type="text" size="large" onClick={closeMenu}>
            <Link to="/">Главная</Link>
          </Button>
          <Button type="text" size="large" onClick={closeMenu}>
            <Link to="/create">Создать</Link>
          </Button>
          <Button type="text" size="large" onClick={closeMenu}>
            <Link to="/specialists">Специалисты</Link>
          </Button>
          {isAuthenticated && user ? (
            <Button type="text" size="large" onClick={closeMenu}>
              <Link to="/profile">Профиль</Link>
            </Button>
          ) : (
            <Button type="text" size="large" onClick={closeMenu}>
              <Link to="/auth">Вход</Link>
            </Button>
          )}
        </div>
      </Drawer>
    </Header>
  );
}

export default AppHeader;