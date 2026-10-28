import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw, ImageFont
import os

url = "https://dt.fdasilvagraca.pt"

# 1. Gerar o QR Code com alta resolução e tolerância a erros (ERROR_CORRECT_H = até 30%)
qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=24,
    border=2,
)
qr.add_data(url)
qr.make(fit=True)

# Cores institucionais
qr_img = qr.make_image(
    image_factory=StyledPilImage,
    module_drawer=RoundedModuleDrawer(),
    color_mask=SolidFillColorMask(
        back_color=(255, 255, 255),
        front_color=(130, 95, 150) # #825f96
    )
).convert("RGBA")

# 2. Inserir APENAS o desenho / símbolo gráfico no centro
symbol = Image.open("public/images/qr/simbolo_apenas.png").convert("RGBA")

# O símbolo é vertical (191 x 474). Vamos colocá-lo num badge circular ou quadrado arredondado perfeito
qr_w, qr_h = qr_img.size
badge_size = int(qr_w * 0.24)  # 24% da área do QR
badge = Image.new("RGBA", (badge_size, badge_size), (0, 0, 0, 0))
badge_draw = ImageDraw.Draw(badge)

# Fundo circular branco com rebordo lilás suave
badge_draw.ellipse(
    [2, 2, badge_size - 2, badge_size - 2],
    fill=(255, 255, 255, 255),
    outline=(165, 129, 185, 255),
    width=4
)

# Ajustar tamanho do símbolo com margem de respiração
sym_max_h = int(badge_size * 0.72)
aspect = symbol.width / symbol.height
sym_w = int(sym_max_h * aspect)
sym_resized = symbol.resize((sym_w, sym_max_h), Image.Resampling.LANCZOS)

# Colar no centro do badge circular
sym_x = (badge_size - sym_w) // 2
sym_y = (badge_size - sym_max_h) // 2
badge.paste(sym_resized, (sym_x, sym_y), sym_resized)

# Colar badge no centro do QR
qr_center_x = (qr_w - badge_size) // 2
qr_center_y = (qr_h - badge_size) // 2
qr_img.paste(badge, (qr_center_x, qr_center_y), badge)

# Guardar QR Code limpo
os.makedirs("public/images/qr", exist_ok=True)
qr_img.save("public/images/qr/qrcode_apenas.png", quality=100)

# =========================================================================
# 3. CRIAR CARTAZ OTIMIZADO PARA FORMATO A5 (148 x 210 mm a 300 DPI: 1748 x 2480 px)
# Hierarquia pensada para leitura rápida à distância no stand de feira:
# - Cabeçalho institucional limpo e marcante
# - Chamada gigante e convidativa
# - QR Code em destaque máximo central
# - Botão com o link direto e lista de farmácias clara
# =========================================================================
w = 1748
h = 2480
poster = Image.new("RGBA", (w, h), (255, 255, 255, 255))
draw = ImageDraw.Draw(poster)

# Fundo de topo em gradiente roxo/lilás de forte impacto (altura 480px)
header_h = 480
for y in range(header_h):
    ratio = y / header_h
    r = int(120 + (165 - 120) * ratio)
    g = int(85 + (129 - 85) * ratio)
    b = int(145 + (185 - 145) * ratio)
    draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

# Fontes (escaladas para A5 a 300 DPI para visibilidade impecável)
font_brand = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 68, index=0)
font_subtitle = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 38, index=0)
font_pharmacies = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 34, index=0)

font_headline = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 76, index=0) # Texto gigante
font_subheadline = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 50, index=0) # Texto secundário grande

font_url = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 48, index=0)
font_pillars = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 40, index=0)
font_footer = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 32, index=0)

# 1. Cabeçalho
draw.text((w // 2, 130), "FARMÁCIAS F. DA SILVA GRAÇA", fill=(255, 255, 255, 255), font=font_brand, anchor="mm")
draw.text((w // 2, 220), "Parceiro de Confiança para Lares e ERPI", fill=(245, 235, 255, 255), font=font_subtitle, anchor="mm")

# Faixa com as 4 farmácias bem visível no cabeçalho
draw.text((w // 2, 330), "Nova da Vila  •  Ilha  •  Colmeias  •  Souto da Carpalhosa", fill=(255, 255, 255, 240), font=font_pharmacies, anchor="mm")

# Linha divisória de luz
draw.line([(120, 420), (w - 120, 420)], fill=(255, 255, 255, 120), width=3)

# 2. Chamada à Ação GIGANTE e Muito Clara
draw.text((w // 2, 590), "Aponte a câmara do telemóvel", fill=(35, 30, 45, 255), font=font_headline, anchor="mm")

# Tag chamativa colorida para a roleta
badge_tag_w = 1200
badge_tag_h = 90
badge_tag_x = (w - badge_tag_w) // 2
badge_tag_y = 660
draw.rounded_rectangle(
    [badge_tag_x, badge_tag_y, badge_tag_x + badge_tag_w, badge_tag_y + badge_tag_h],
    radius=45,
    fill=(250, 243, 253, 255),
    outline=(165, 129, 185, 255),
    width=3
)
draw.text((w // 2, badge_tag_y + badge_tag_h // 2), "🎁 Registe-se e receba o PIN da Roleta de Prémios!", fill=(130, 95, 150, 255), font=font_subheadline, anchor="mm")

# 3. QR Code Central em Destaque Máximo (Grande para leitura fácil a mais de 1 metro de distância em mesa A5)
qr_box_size = 1000
qr_box_x = (w - qr_box_size) // 2
qr_box_y = 790

# Sombra e moldura suave
draw.rounded_rectangle(
    [qr_box_x - 30, qr_box_y - 30, qr_box_x + qr_box_size + 30, qr_box_y + qr_box_size + 30],
    radius=50,
    fill=(255, 255, 255, 255),
    outline=(220, 205, 235, 255),
    width=6
)

# Colar o QR code redimensionado
qr_fit = qr_img.resize((qr_box_size, qr_box_size), Image.Resampling.LANCZOS)
poster.paste(qr_fit, (qr_box_x, qr_box_y), qr_fit)

# 4. Botão com URL Direto Bem Visível
pill_w = 860
pill_h = 100
pill_x = (w - pill_w) // 2
pill_y = 1870
draw.rounded_rectangle(
    [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
    radius=50,
    fill=(130, 95, 150, 255)
)
draw.text((w // 2, pill_y + pill_h // 2), "🌐  dt.fdasilvagraca.pt", fill=(255, 255, 255, 255), font=font_url, anchor="mm")

# 5. Pilares de Soluções com ícones em destaque
draw.text((w // 2, 2070), "💊  PIM (Preparação Individualizada da Medicação)", fill=(40, 35, 50, 255), font=font_pillars, anchor="mm")
draw.text((w // 2, 2145), "📋  Apoio Técnico Farmacêutico Dedicado  •  🚚  Entregas Rápidas", fill=(80, 75, 90, 255), font=font_pillars, anchor="mm")

# 6. Rodapé elegante
for y in range(h - 100, h):
    draw.line([(0, y), (w, y)], fill=(130, 95, 150, 255))

draw.text((w // 2, h - 50), "Farmácias F. da Silva Graça — Soluções de Saúde e Apoio a Instituições", fill=(255, 255, 255, 255), font=font_footer, anchor="mm")

# Guardar PNG e PDF A5 a 300 DPI
poster.save("public/images/qr/cartaz_stand_feira_qrcode.png", quality=100)
poster_rgb = poster.convert("RGB")
poster_rgb.save("public/images/qr/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=300.0)

# Atualizar artefactos
artifact_dir = "/Users/raulalmeida/.gemini/antigravity/brain/cb1eb81d-52f7-40c6-91c8-f34792963651"
poster.save(f"{artifact_dir}/cartaz_stand_feira_qrcode.png")
poster_rgb.save(f"{artifact_dir}/cartaz_stand_feira_qrcode.pdf", "PDF", resolution=300.0)
qr_img.save(f"{artifact_dir}/qrcode_apenas.png")

print("A5 Cartaz e QR Code com símbolo limpo gerados com sucesso!")
