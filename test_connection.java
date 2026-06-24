import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class test_connection {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/arcadia_comics?useSSL=false&serverTimezone=UTC";
        String username = "root";
        String password = ""; // Cambia esto por tu contraseña
        
        try {
            System.out.println("Conectando a MySQL...");
            Connection conn = DriverManager.getConnection(url, username, password);
            System.out.println("✅ Conexión exitosa a la base de datos!");
            conn.close();
        } catch (SQLException e) {
            System.out.println("❌ Error de conexión: " + e.getMessage());
        }
    }
}
