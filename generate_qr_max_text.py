import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw, ImageFont
import cv2
import os

url = "https://dt.fdasilvagraca.pt"

# 1. Gerar o QR Code
qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=24,
    border=2,
)
qr.add_data(url)
qr.make(fit=True)

qr_img = qr.make_image(
    image_factory=StyledPilImage,
    module_drawer=RoundedModuleDrawer(),
    color_mask=SolidFillColorMask(
        back_color=(255, 255, 255),
        front_color=(130, 95, 150) # #825f96
    )
).convert("RGBA")

# 2. Badge central com símbolo limpo
symbol = Image.open("public/images/qr/simbolo_apenas.png").convert("RGBA")
qr_w, qr_h = qr_img.size
badge_size = int(qr_w * 0.22)
badge = Image.new("RGBA", (badge_size, badge_size), (0, 0, 0, 0))
badge_draw = ImageDraw.Draw(badge)
badge_draw.ellipse(
    [2, 2, badge_size - 2, badge_size - 2],
    fill=(255, 255, 255, 255),
    outline=(165, 129, 185, 255),
    width=4
)
sym_h = int(badge_size * 0.72)
aspect = symbol.width / symbol.height
sym_w = int(sym_h * aspect)
sym_resized = symbol.resize((sym_w, sym_h), Image.Resampling.LANCZOS)
badge.paste(sym_resized, ((badge_size - sym_w) // 2, (badge_size - sym_h) // 2), sym_resized)
qr_img.paste(badge, ((qr_w - badge_size) // 2, (qr_h - badge_size) // 2), badge)

# =========================================================================
# 3. CARTAZ A5 COM FONTES MÁXIMAS E ULTRA-LEGÍVEIS (1748 x 2480 px @ 300 DPI)
# =========================================================================
w = 1748
h = 2480
poster = Image.new("RGBA", (w, h), (255, 255, 255, 255))
draw = ImageDraw.Draw(poster)

sf_bold = "/System/Library/Fonts/SFNS.ttf"
sf_rounded = "/System/Library/Fonts/SFNSRounded.ttf"

# FONTES MAXIMIZADAS
font_header_title = ImageFont.truetype(sf_rounded, 96)   # 96pt!
font_header_sub = ImageFont.truetype(sf_bold, 52)         # 52pt!
font_action_huge = ImageFont.truetype(sf_rounded, 130)   # 130pt GIGANTE!
font_reward = ImageFont.truetype(sf_rounded, 64)          # 64pt!
font_link_huge = ImageFont.truetype(sf_rounded, 72)       # 72pt no botão!
font_footer_large = ImageFont.truetype(sf_bold, 44)       # 44pt farmácias!

# Topo: Cabeçalho com fundo lilás elegante (altura 380px)
for y in range(380):
    ratio = y / 380
    r = int(125 + (155 - 125) * ratio)
    g = int(90 + (125 - 90) * ratio)
    b = int(145 + (180 - 145) * ratio)
    draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

draw.text((w // 2, 140), "Farmácias F. da Silva Graça", fill=(255, 255, 255, 255), font=font_header_title, anchor="mm")
draw.text((w // 2, 260), "Apoio a Lares e Instituições", fill=(245, 235, 255, 255), font=font_header_sub, anchor="mm")

# Chamada à Ação ULTRA-GIGANTE
draw.text((w // 2, 510), "Aponte a Câmara", fill=(18, 18, 26, 255), font=font_action_huge, anchor="mm")

# Badge da Roleta bem grande e destacado
badge_w = 1380
badge_h = 120
badge_x = (w - badge_w) // 2
badge_y = 610
draw.rounded_rectangle(
    [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
    radius=60,
    fill=(250, 244, 253, 255),
    outline=(165, 129, 185, 255),
    width=4
)
draw.text((w // 2, badge_y + badge_h // 2), "🎰 Rode a Roleta de Prémios no Stand!", fill=(130, 95, 150, 255), font=font_reward, anchor="mm")

# QR Code central
qr_size = 940
qr_x = (w - qr_size) // 2
qr_y = 780

draw.rounded_rectangle(
    [qr_x - 20, qr_y - 20, qr_x + qr_size + 20, qr_y + qr_size + 20],
    radius=45,
    fill=(255, 255, 255, 255),
    outline=(230, 222, 238, 255),
    width=5
)
qr_fit = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
poster.paste(qr_fit, (qr_x, qr_y), qr_fit)

# Botão do Link Direto com Fonte GIGANTE (72pt)
btn_w = 980
btn_h = 124
btn_x = (w - btn_w) // 2
btn_y = 1780
draw.rounded_rectangle(
    [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
    radius=62,
    fill=(130, 95, 150, 255)
)
draw.text((w // 2, btn_y + btn_h // 2), "dt.fdasilvagraca.pt", fill=(255, 255, 255, 255), font=font_link_huge, anchor="mm")

# Base com as 4 Farmácias em Letra Bem Grande (44pt)
draw.text((w // 2, 2030), "Nova da Vila  •  Ilha", fill=(35, 30, 45, 255), font=font_footer_large, anchor="mm")
draw.text((w // 2, 2110), "Colmeias  •  Souto da Carpalhosa", fill=(35, 30, 45, 255), font=font_footer_large, anchor="mm")

# Faixa final institucional
for y in range(h - 140, h):
    draw.line([(0, y), (w, y)], fill=(130, 95, 150, 255))

draw.text((w // 2, h - 70), "Farmácias F. da Silva Graça", fill=(255, 255, 255, 255), font=ImageFont.truetype(sf_rounded, 48), anchor="mm")

# Guardar PNG e PDF A5 a 300 DPI
poster.save("public/images/qr/cartaz_stand_feira_qrcode.png", quality=100)
poster_rgb = poster.convert("RGB")
poster_rgb.save("public/images/qr/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=300.0)

# Atualizar directoria de artefactos
artifact_dir = "/Users/raulalmeida/.gemini/antigravity/brain/cb1eb81d-52f7-40c6-91c8-f34792963651"
poster.save(f"{artifact_dir}/cartaz_stand_feira_qrcode.png")
poster_rgb.save(f"{artifact_dir}/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=300.0)

val, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread("public/images/qr/cartaz_stand_feira_qrcode.png"))
print("A5 Max Text Decoded:", val)
