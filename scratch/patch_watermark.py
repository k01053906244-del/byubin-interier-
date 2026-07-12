from PIL import Image, ImageDraw

def apply_patch(img_path, out_path, W, H, src_x, src_y, dest_x, dest_y, width, height):
    img = Image.open(img_path).convert("RGBA")
    
    # 1. Crop the source clean patch of floor
    patch = img.crop((src_x, src_y, src_x + width, src_y + height))
    
    # 2. Create a feathered alpha mask to blend the edges smoothly
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # We will draw nested rectangles with increasing opacity to feather the border
    feather_radius = 12
    for i in range(feather_radius):
        alpha = int(255 * (i / feather_radius))
        draw.rectangle(
            [i, i, width - 1 - i, height - 1 - i],
            outline=alpha
        )
    # The core is fully opaque
    draw.rectangle(
        [feather_radius, feather_radius, width - 1 - feather_radius, height - 1 - feather_radius],
        fill=255
    )
    
    # 3. Paste the patch over the watermark using the feathered mask
    img.paste(patch, (dest_x, dest_y), mask)
    
    # 4. Save the patched image back
    img.convert("RGB").save(out_path, "PNG")
    print(f"Successfully patched {img_path} -> {out_path}")

# --- Before Image: 1024 x 768 ---
# Watermark is roughly in bottom-right corner, let's cover W-160 to W-20 and H-160 to H-20
# We paste a clean patch of size 140x140 from the left (W-320 to W-180)
before_W, before_H = 1024, 768
apply_patch(
    img_path='public/living_room_before.png',
    out_path='public/living_room_before.png',
    W=before_W, H=before_H,
    src_x=before_W - 320, src_y=before_H - 150,
    dest_x=before_W - 170, dest_y=before_H - 150,
    width=150, height=130
)

# --- After Image: 1195 x 896 ---
# Watermark is in the bottom-right area. Let's cover W-180 to W-30 and H-180 to H-30
# We paste a clean patch of size 180x140 from the left (W-380 to W-200)
after_W, after_H = 1195, 896
apply_patch(
    img_path='public/living_room_after.png',
    out_path='public/living_room_after.png',
    W=after_W, H=after_H,
    src_x=after_W - 380, src_y=after_H - 160,
    dest_x=after_W - 200, dest_y=after_H - 160,
    width=180, height=140
)
