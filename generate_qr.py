import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw, ImageFont
import os

url = "https://dt.fdasilvagraca.pt"

# 1. Gerar o QR Code com alta resolução e tolerância a erros (ERROR_CORRECT_H = até 30% de cobertura)
qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=20,
    border=2,
)
qr.add_data(url)
qr.make(fit=True)

# Cores institucionais:
# Roxo escuro: #825f96 -> (130, 95, 150)
# Lilás / Malva: #a581b9 -> (165, 129, 185)
qr_img = qr.make_image(
    image_factory=StyledPilImage,
    module_drawer=RoundedModuleDrawer(),
    color_mask=SolidFillColorMask(
        back_color=(255, 255, 255),
        front_color=(130, 95, 150)
    )
).convert("RGBA")

# 2. Inserir o ícone no centro do QR code
logo = Image.open("public/images/logo.png").convert("RGBA")
# Redimensionar logo para caber no centro (aprox 22% do tamanho do QR)
qr_w, qr_h = qr_img.size
target_logo_w = int(qr_w * 0.22)
aspect = logo.height / logo.width
target_logo_h = int(target_logo_w * aspect)
logo_resized = logo.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)

# Criar badge circular/arredondado branco com sombra/borda lilás para o logo central
badge_pad = 16
badge_w = target_logo_w + badge_pad * 2
badge_h = target_logo_h + badge_pad * 2
badge = Image.new("RGBA", (badge_w, badge_h), (0, 0, 0, 0))
badge_draw = ImageDraw.Draw(badge)
badge_draw.rounded_rectangle(
    [0, 0, badge_w, badge_h],
    radius=18,
    fill=(255, 255, 255, 255),
    outline=(165, 129, 185, 255),
    width=3
)
# Colar logo no centro do badge
logo_x = (badge_w - target_logo_w) // 2
logo_y = (badge_h - target_logo_h) // 2
badge.paste(logo_resized, (logo_x, logo_y), logo_resized)

# Colar badge no centro do QR
qr_center_x = (qr_w - badge_w) // 2
qr_center_y = (qr_h - badge_h) // 2
qr_img.paste(badge, (qr_center_x, qr_center_y), badge)

# 3. Guardar versão simples transparente/alta definição apenas do QR Code
os.makedirs("public/images/qr", exist_ok=True)
qr_img.save("public/images/qr/qrcode_apenas.png", quality=100)

# 4. Criar Cartaz / Placa de Mesa A5/A4 para Impressão da Feira (1200 x 1700 px)
card_w = 1200
card_h = 1750
poster = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 255))
draw = ImageDraw.Draw(poster)

# Fundo com gradiente suave / cabeçalho elegante
header_h = 320
for y in range(header_h):
    ratio = y / header_h
    r = int(130 + (165 - 130) * ratio)
    g = int(95 + (129 - 95) * ratio)
    b = int(150 + (185 - 150) * ratio)
    draw.line([(0, y), (card_w, y)], fill=(r, g, b, 255))

# Fontes
font_title = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 48, index=0)
font_subtitle = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 28, index=0)
font_action = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 42, index=0)
font_subaction = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 26, index=0)
font_url = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 30, index=0)
font_footer = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 22, index=0)

# Texto do Cabeçalho
title_text = "FARMÁCIAS F. DA SILVA GRAÇA"
draw.text((card_w // 2, 90), title_text, fill=(255, 255, 255, 255), font=font_title, anchor="mm")

subtitle_text = "Parceiro de Confiança para Lares e ERPI"
draw.text((card_w // 2, 160), subtitle_text, fill=(245, 235, 250, 255), font=font_subtitle, anchor="mm")

pharmacies_text = "Nova da Vila  •  Ilha  •  Colmeias  •  Souto da Carpalhosa"
draw.text((card_w // 2, 225), pharmacies_text, fill=(255, 255, 255, 230), font=font_subaction, anchor="mm")

# Chamada para ação por cima do QR
draw.text((card_w // 2, 400), "Aponte a câmara do telemóvel", fill=(45, 49, 66, 255), font=font_action, anchor="mm")
draw.text((card_w // 2, 455), "Registe-se e receba o PIN para a Roleta de Prémios! 🎁", fill=(130, 95, 150, 255), font=font_subaction, anchor="mm")

# Caixa / Moldura branca para o QR Code
qr_box_size = 720
qr_box_x = (card_w - qr_box_size) // 2
qr_box_y = 510

draw.rounded_rectangle(
    [qr_box_x - 15, qr_box_y - 15, qr_box_x + qr_box_size + 15, qr_box_y + qr_box_size + 15],
    radius=30,
    fill=(255, 255, 255, 255),
    outline=(230, 220, 240, 255),
    width=4
)

# Redimensionar o QR estilizado para caber perfeitamente na moldura
qr_fit = qr_img.resize((qr_box_size, qr_box_size), Image.Resampling.LANCZOS)
poster.paste(qr_fit, (qr_box_x, qr_box_y), qr_fit)

# URL / Link direto em baixo do QR em pill box
pill_w = 560
pill_h = 60
pill_x = (card_w - pill_w) // 2
pill_y = 1280
draw.rounded_rectangle(
    [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
    radius=30,
    fill=(250, 245, 253, 255),
    outline=(165, 129, 185, 255),
    width=2
)
draw.text((card_w // 2, pill_y + pill_h // 2), "dt.fdasilvagraca.pt", fill=(130, 95, 150, 255), font=font_url, anchor="mm")

# Benefícios destacados no fundo
benefits_y = 1390
draw.text((card_w // 2, benefits_y), "💊 PIM (Unidose)  •  📋 Apoio Farmacêutico  •  🚚 Entregas Dedicadas", fill=(90, 80, 100, 255), font=font_subaction, anchor="mm")

# Rodapé decorativo
for y in range(card_h - 60, card_h):
    draw.line([(0, y), (card_w, y)], fill=(130, 95, 150, 255))

draw.text((card_w // 2, card_h - 30), "Farmácias F. da Silva Graça — Todos os direitos reservados", fill=(255, 255, 255, 255), font=font_footer, anchor="mm")

poster_path = "public/images/qr/cartaz_stand_feira_qrcode.png"
poster.save(poster_path, quality=100)
print(f"Salvo: {poster_path}")

# Copiar também para a diretoria de artefactos para visualização
artifact_dir = "/Users/raulalmeida/.gemini/antigravity/brain/cb1eb81d-52f7-40c6-91c8-f34792963651"
poster.save(f"{artifact_dir}/cartaz_stand_feira_qrcode.png")
qr_img.save(f"{artifact_dir}/qrcode_apenas.png")
print("Copiado para diretoria de artefactos.")
