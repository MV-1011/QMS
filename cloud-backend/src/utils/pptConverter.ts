import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const execAsync = promisify(exec);

interface ConversionResult {
  success: boolean;
  slides: string[];
  slideCount: number;
  error?: string;
}

/**
 * Convert PowerPoint file to PNG images using LibreOffice
 * Each slide becomes a separate image
 */
export const convertPptToImages = async (
  inputPath: string,
  outputDir: string
): Promise<ConversionResult> => {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // First convert PPT to PDF using LibreOffice
    const pdfOutputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));

    logger.info(`Converting PPT to PDF: ${inputPath}`);

    // Convert to PDF first
    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir "${pdfOutputDir}" "${inputPath}"`,
      { timeout: 120000 } // 2 minute timeout
    );

    const pdfPath = path.join(pdfOutputDir, `${baseName}.pdf`);

    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF conversion failed - file not created');
    }

    logger.info(`PDF created: ${pdfPath}`);

    // Now convert PDF to images using pdftoppm (from poppler-utils)
    const outputPrefix = path.join(outputDir, 'slide');

    await execAsync(
      `pdftoppm -png -r 150 "${pdfPath}" "${outputPrefix}"`,
      { timeout: 120000 }
    );

    // Clean up the intermediate PDF
    fs.unlinkSync(pdfPath);

    // Get list of generated slide images
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('slide-') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide-(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide-(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    const slides = files.map(f => path.join(outputDir, f));

    logger.info(`Converted PPT to ${slides.length} slide images`);

    return {
      success: true,
      slides,
      slideCount: slides.length,
    };
  } catch (error: any) {
    logger.error('PPT conversion error:', error);
    return {
      success: false,
      slides: [],
      slideCount: 0,
      error: error.message || 'Failed to convert PowerPoint file',
    };
  }
};

/**
 * Check if required conversion tools are available
 */
export const checkConversionTools = async (): Promise<{ libreoffice: boolean; pdftoppm: boolean }> => {
  let libreoffice = false;
  let pdftoppm = false;

  try {
    await execAsync('which libreoffice');
    libreoffice = true;
  } catch {
    libreoffice = false;
  }

  try {
    await execAsync('which pdftoppm');
    pdftoppm = true;
  } catch {
    pdftoppm = false;
  }

  return { libreoffice, pdftoppm };
};

export default { convertPptToImages, checkConversionTools };
