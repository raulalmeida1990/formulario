from PIL import Image

# Converter cartaz para PDF pronto a imprimir em gráfica ou impressora A4
cartaz_img = Image.open("public/images/qr/cartaz_stand_feira_qrcode.png").convert("RGB")
cartaz_img.save("public/images/qr/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=150.0)
cartaz_img.save("/Users/raulalmeida/.gemini/antigravity/brain/cb1eb81d-52f7-40c6-91c8-f34792963651/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=150.0)
print("PDF gerado com sucesso!")
