from PIL import Image
import numpy as np

def find_watermark_bbox(img_path):
    img = Image.open(img_path).convert('RGB')
    W, H = img.size
    # Focus on the bottom-right quadrant
    crop_x = int(W * 0.75)
    crop_y = int(H * 0.75)
    
    img_np = np.array(img)
    
    # We will look for pixel coordinates in the bottom right that have high contrast
    # or deviate from typical floor colors
    # Let's save a visual grid of coordinates in the log to inspect
    print(f"Scanning image {img_path} ({W}x{H}) bottom-right area...")
    
    # Let's find pixels that are noticeably brighter/greyer than the floor
    # We will scan from crop_x to W and crop_y to H
    contrast_points = []
    for y in range(crop_y, H - 20):
        for x in range(crop_x, W - 20):
            r, g, b = img_np[y, x]
            # Watermark is often greyish/white/silver, so R, G, B are close to each other and relatively bright
            # or it has a higher brightness than the surrounding dark wood floor
            # Let's find local contrast by comparing with neighbor at x-20
            r_n, g_n, b_n = img_np[y, x - 20]
            diff = abs(int(r) - int(r_n)) + abs(int(g) - int(g_n)) + abs(int(b) - int(b_n))
            if diff > 60:  # High contrast threshold
                contrast_points.append((x, y, diff))
                
    if not contrast_points:
        print("No high contrast watermark points detected automatically.")
        return None
        
    # Find bounding box of contrast points
    xs = [p[0] for p in contrast_points]
    ys = [p[1] for p in contrast_points]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    print(f"Detected potential watermark bounding box: X({min_x} to {max_x}), Y({min_y} to {max_y})")
    return (min_x, min_y, max_x, max_y)

find_watermark_bbox('public/living_room_before.png')
find_watermark_bbox('public/living_room_after.png')
