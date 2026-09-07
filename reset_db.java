import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class reset_db {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/arcadia_usuarios?useSSL=false&serverTimezone=UTC";
        String username = "root";
        String password = ""; 
        
        try {
            System.out.println("Conectando a MySQL para limpiar usuarios de prueba...");
            Connection conn = DriverManager.getConnection(url, username, password);
            Statement stmt = conn.createStatement();
            
            int deleted = stmt.executeUpdate("DELETE FROM usuarios WHERE email IN ('admin@arcadia.com', 'cliente@arcadia.com')");
            System.out.println("Se eliminaron " + deleted + " usuarios de prueba antiguos.");
            
            conn.close();
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
