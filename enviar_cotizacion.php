<?php
// 1. Recibir la información enviada desde JavaScript (formato JSON)
$data = json_decode(file_get_contents('php://input'), true);

// Si alguien intenta abrir este archivo directamente en el navegador, lo bloqueamos
if (!$data) {
    http_response_code(400);
    exit("No se recibieron datos.");
}

$nombreCliente = $data['nombre'];
$emailCliente = $data['email'];
$pdfBase64Completo = $data['pdf'];

// 2. Separar los metadatos de Base64 del contenido real del archivo PDF
list($tipo, $pdfBase64Completo) = explode(';', $pdfBase64Completo);
list(, $pdfBase64Completo)      = explode(',', $pdfBase64Completo);
$pdfDecodificado = base64_decode($pdfBase64Completo);

// 3. Configuración de los correos
// Se enviará el PDF tanto al cliente como a tu correo de contacto
$para = $emailCliente . ", contacto@sistecint.com"; 
$asunto = "Cotización de Equipos y Servicios - SISTEC INT";
$remitente = "contacto@sistecint.com";

// Generar un límite (boundary) para separar el texto del correo del archivo adjunto
$boundary = md5(time());

// 4. Cabeceras del correo
$headers = "From: SISTEC INT <" . $remitente . ">\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"\r\n";

// 5. Cuerpo del mensaje (El texto que leerá el cliente en su bandeja de entrada)
$mensaje = "--" . $boundary . "\r\n";
$mensaje .= "Content-Type: text/plain; charset=UTF-8\r\n";
$mensaje .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$mensaje .= "Hola " . $nombreCliente . ",\r\n\r\n";
$mensaje .= "Gracias por cotizar con SISTEC INT. Adjunto a este correo encontrarás el documento PDF con tu cotización detallada.\r\n\r\n";
$mensaje .= "Para cualquier duda o para confirmar tu pedido, puedes responder a este correo o llamarnos al (507) 6586-5061.\r\n\r\n";
$mensaje .= "Saludos cordiales,\r\nEl equipo de SISTEC INT\r\n";

// 6. Cuerpo del mensaje (El Archivo PDF Adjunto)
$mensaje .= "--" . $boundary . "\r\n";
$mensaje .= "Content-Type: application/pdf; name=\"Cotizacion_SISTEC_INT.pdf\"\r\n";
$mensaje .= "Content-Transfer-Encoding: base64\r\n";
$mensaje .= "Content-Disposition: attachment; filename=\"Cotizacion_SISTEC_INT.pdf\"\r\n\r\n";
$mensaje .= chunk_split(base64_encode($pdfDecodificado)) . "\r\n";
$mensaje .= "--" . $boundary . "--";

// 7. Enviar el correo y reportar éxito o error a la ventana del cliente
if(mail($para, $asunto, $mensaje, $headers)) {
    http_response_code(200);
    echo "Correo enviado exitosamente.";
} else {
    http_response_code(500);
    echo "Error interno al enviar el correo.";
}
?>