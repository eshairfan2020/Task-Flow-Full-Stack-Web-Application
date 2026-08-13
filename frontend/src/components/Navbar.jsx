import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        task<span className="dot">flow</span>
      </Link>
      {user && (
        <div className="nav-right">
          <span>{user.name} · {user.role}</span>
          <button className="btn" onClick={logout}>Log out</button>
        </div>
      )}
    </header>
  );
}
