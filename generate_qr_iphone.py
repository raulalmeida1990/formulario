import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw, ImageFont
import cv2
import os

url = "https://dt.fdasilvagraca.pt"

# 1. Gerar o QR Code com módulos arredondados estilo iOS
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
        front_color=(130, 95, 150) # Roxo #825f96
    )
).convert("RGBA")

# 2. Badge circular no centro com APENAS o símbolo gráfico
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

# Guardar QR limpo
qr_img.save("public/images/qr/qrcode_apenas.png", quality=100)

# =========================================================================
# 3. CARTAZ A5 ESTILO APPLE / iOS (1748 x 2480 px @ 300 DPI)
# Filosofia Apple:
# - Tipografia SF Pro / SF Rounded limpa, moderna e minimalista
# - Pouco texto, mas GIGANTE e direto ao ponto
# - Cartão flutuante iOS com sombra suave e cantos arredondados (squircle)
# =========================================================================
w = 1748
h = 2480
poster = Image.new("RGBA", (w, h), (247, 246, 250, 255)) # Fundo cinza suave Apple
draw = ImageDraw.Draw(poster)

# Fontes Apple nativas
sf_bold = "/System/Library/Fonts/SFNS.ttf"
sf_rounded = "/System/Library/Fonts/SFNSRounded.ttf"

font_super_title = ImageFont.truetype(sf_rounded, 88)     # Nome da Empresa GIGANTE
font_tagline = ImageFont.truetype(sf_bold, 44)            # Subtítulo direto
font_action_huge = ImageFont.truetype(sf_rounded, 96)     # Chamada principal GIGANTE
font_subaction = ImageFont.truetype(sf_bold, 54)          # Roleta / Prémio
font_link_huge = ImageFont.truetype(sf_rounded, 56)       # Link em destaque
font_footer_pharmacies = ImageFont.truetype(sf_bold, 36)  # As 4 farmácias na base

# 1. Topo: Branding simples e de grande porte
draw.text((w // 2, 140), "Farmácias F. da Silva Graça", fill=(30, 25, 40, 255), font=font_super_title, anchor="mm")
draw.text((w // 2, 225), "Soluções e Apoio Dedicado a Lares e ERPI", fill=(130, 95, 150, 255), font=font_tagline, anchor="mm")

# 2. Frase de Ação Minimalista e Gigante
draw.text((w // 2, 380), "Aponte a Câmara", fill=(18, 18, 24, 255), font=font_action_huge, anchor="mm")

# Pill com o incentivo (Prémio / Roleta) estilo iOS Badge
pill_reward_w = 1260
pill_reward_h = 100
pill_reward_x = (w - pill_reward_w) // 2
pill_reward_y = 460
draw.rounded_rectangle(
    [pill_reward_x, pill_reward_y, pill_reward_x + pill_reward_w, pill_reward_y + pill_reward_h],
    radius=50,
    fill=(255, 255, 255, 255),
    outline=(165, 129, 185, 255),
    width=3
)
draw.text((w // 2, pill_reward_y + pill_reward_h // 2), "🎰 Rode a Roleta de Prémios no Stand!", fill=(130, 95, 150, 255), font=font_subaction, anchor="mm")

# 3. Card do QR Code estilo iOS (Branco puro com cantos arredondados generosos)
card_pad = 80
card_w = 1280
card_h = 1320
card_x = (w - card_w) // 2
card_y = 610

# Borda elegante do card
draw.rounded_rectangle(
    [card_x, card_y, card_x + card_w, card_y + card_h],
    radius=64,
    fill=(255, 255, 255, 255),
    outline=(230, 226, 238, 255),
    width=4
)

# Colar QR Code dentro do card em tamanho gigante
qr_display_size = 1040
qr_x = (w - qr_display_size) // 2
qr_y = card_y + 80
qr_fit = qr_img.resize((qr_display_size, qr_display_size), Image.Resampling.LANCZOS)
poster.paste(qr_fit, (qr_x, qr_y), qr_fit)

# Botão Link Direto estilo iOS Button no fundo do card
btn_link_w = 840
btn_link_h = 96
btn_link_x = (w - btn_link_w) // 2
btn_link_y = card_y + card_h - 150
draw.rounded_rectangle(
    [btn_link_x, btn_link_y, btn_link_x + btn_link_w, btn_link_y + btn_link_h],
    radius=48,
    fill=(130, 95, 150, 255) # Roxo primário
)
draw.text((w // 2, btn_link_y + btn_link_h // 2), "dt.fdasilvagraca.pt", fill=(255, 255, 255, 255), font=font_link_huge, anchor="mm")

# 4. Rodapé minimalista com as 4 farmácias bem visíveis
footer_box_y = 2020
draw.text((w // 2, footer_box_y), "Farmácia Nova da Vila  •  Farmácia Ilha", fill=(60, 55, 75, 255), font=font_footer_pharmacies, anchor="mm")
draw.text((w // 2, footer_box_y + 55), "Farmácia Colmeias  •  Farmácia Souto da Carpalhosa", fill=(60, 55, 75, 255), font=font_footer_pharmacies, anchor="mm")

# Tagline inferior limpa
draw.text((w // 2, 2200), "Preparação Individualizada da Medicação (PIM)  •  Entregas Dedicadas", fill=(130, 125, 140, 255), font=ImageFont.truetype(sf_bold, 34), anchor="mm")

# Guardar PNG e PDF A5 a 300 DPI
poster.save("public/images/qr/cartaz_stand_feira_qrcode.png", quality=100)
poster_rgb = poster.convert("RGB")
poster_rgb.save("public/images/qr/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=300.0)

# Atualizar directoria de artefactos
artifact_dir = "/Users/raulalmeida/.gemini/antigravity/brain/cb1eb81d-52f7-40c6-91c8-f34792963651"
poster.save(f"{artifact_dir}/cartaz_stand_feira_qrcode.png")
poster_rgb.save(f"{artifact_dir}/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=300.0)
qr_img.save(f"{artifact_dir}/qrcode_apenas.png")

# Testar descodificação óptica
val, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread("public/images/qr/cartaz_stand_feira_qrcode.png"))
print("A5 iPhone Style Decoded:", val)
