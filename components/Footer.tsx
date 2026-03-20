export default function Footer() {
  return (
    <footer style={{ 
      width: '100%', 
      height: '4rem', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#aaaaaa',
      fontSize: '0.8rem',
      flexShrink: 0
    }}>
      © {new Date().getFullYear()} Citation Bot. All rights reserved.
    </footer>
  );
}
