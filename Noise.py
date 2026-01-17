import cv2
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

def analyze_noise(image_path, title):
    """Analyse le bruit d'une image et génère des visualisations"""
    # Charger l'image
    img = cv2.imread(image_path)
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Créer une figure avec plusieurs sous-graphiques
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    fig.suptitle(title, fontsize=16, fontweight='bold')
    
    # 1. Image originale
    axes[0, 0].imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    axes[0, 0].set_title('Image Originale')
    axes[0, 0].axis('off')
    
    # 2. Analyse du bruit (High-pass filter)
    blurred = cv2.GaussianBlur(img_gray, (5, 5), 0)
    noise = cv2.subtract(img_gray, blurred)
    axes[0, 1].imshow(noise, cmap='gray')
    axes[0, 1].set_title('Pattern de Bruit Extrait')
    axes[0, 1].axis('off')
    
    # 3. Histogramme du bruit
    axes[0, 2].hist(noise.ravel(), bins=50, color='blue', alpha=0.7)
    axes[0, 2].set_title('Distribution du Bruit')
    axes[0, 2].set_xlabel('Intensité')
    axes[0, 2].set_ylabel('Fréquence')
    
    # 4. Analyse de texture (Local Binary Pattern)
    from skimage.feature import local_binary_pattern
    lbp = local_binary_pattern(img_gray, P=8, R=1, method='uniform')
    axes[1, 0].imshow(lbp, cmap='gray')
    axes[1, 0].set_title('Local Binary Pattern')
    axes[1, 0].axis('off')
    
    # 5. FFT - Analyse fréquentielle
    f_transform = np.fft.fft2(img_gray)
    f_shift = np.fft.fftshift(f_transform)
    magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1)
    axes[1, 1].imshow(magnitude_spectrum, cmap='jet')
    axes[1, 1].set_title('Spectre Fréquentiel (FFT)')
    axes[1, 1].axis('off')
    
    # 6. Statistiques du bruit
    noise_std = np.std(noise)
    noise_mean = np.mean(noise)
    noise_variance = np.var(noise)
    
    stats_text = f"Moyenne: {noise_mean:.2f}\n"
    stats_text += f"Écart-type: {noise_std:.2f}\n"
    stats_text += f"Variance: {noise_variance:.2f}\n"
    stats_text += f"Min/Max: {noise.min()}/{noise.max()}"
    
    axes[1, 2].text(0.1, 0.5, stats_text, fontsize=12, 
                    verticalalignment='center', family='monospace',
                    bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    axes[1, 2].set_title('Statistiques du Bruit')
    axes[1, 2].axis('off')
    
    plt.tight_layout()
    return fig

# Utilisation
# Pour une vraie photo de voiture
fig_real = analyze_noise('oiginal.jpg', 
                         'Analyse de Bruit - Image Réelle (Capteur Smartphone)')
fig_real.savefig('real_image_noise.png', dpi=300, bbox_inches='tight')

# Pour une image générée par IA
fig_ai = analyze_noise('ai-generated.png', 
                       'Analyse de Bruit - Image Générée par IA')
fig_ai.savefig('ai_image_noise.png', dpi=300, bbox_inches='tight')

plt.show()