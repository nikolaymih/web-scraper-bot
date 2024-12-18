import {Page} from 'puppeteer';
import path from 'path';
import {IEntry} from '@src/models/Entry';
import {initiateScreenShot} from '@src/puppeteer/index';

export async function kepLogin(page: Page) {
  const targetEls = await page.$$('body > div.layout-wrapper > main > div.main-wrapper.section-wrapper.section-wrapper--margins.fixed-content-width > div.page-wrapper > div > div > div:nth-child(3) > section:nth-child(1) > a > div > div > div > h3');
  for (const target of targetEls) {
    const iHtml = await page.evaluate(el => el.innerHTML, target);
    if (iHtml.trim() === 'Вход с КЕП') {
      await target.click();

      await page.waitForNavigation({waitUntil: 'networkidle0'});

      await page.goto('https://e-uslugi.mvr.bg/services/applicationProcesses/371');

      break;
    }
  }
}

export async function handleStepOnePerson(page: Page, entry: IEntry, screenshotPath: string[]) {
  // Стъпка 1.
  // Натисни бутона упълномощител
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(3) > div > div > div:nth-child(2) > input').click();

  // Попълни всички данни на упълномощеното лице

  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.names\\.first').fill(entry.firstName);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.names\\.middle').fill(entry.middleName);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.names\\.last').fill(entry.lastName);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identifier\\.item').fill(entry.securityNumber);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identityDocument\\.identityNumber').fill(entry.documentNumber);

  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identityDocument\\.identitityIssueDate').fill(entry.issuedOn);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identityDocument\\.identityIssuer').fill(entry.issuer);

  await initiateScreenShot(page, `${entry.id}/mvr-step1.jpeg`, screenshotPath);

  // Продължи към стъпка 3
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(3) > div.nav-item-title > button').click();
}

export async function handleStepOneCompany(page: Page, entry: IEntry, screenshotPath: string[]) {
  // Стъпка 1.
  // Натисни бутона юридическо лице
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(3) > div > div > div:nth-child(3) > input').click();

  // Попълни ЕИК на фирма
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemEntityBasicData\\.identifier').fill(entry.bullstat);

  // Натисни бутона извличване на данни
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(4) > div > div.form-group.col-auto > button').click();

  await initiateScreenShot(page, `${entry.id}/mvr-step1.jpeg`, screenshotPath);

  // Продължи към стъпка 3
  setTimeout(async () => {
    await page.locator('#PAGE-NAV > nav > ul > li:nth-child(3) > div.nav-item-title > button').click();
  }, 1000);
}

export async function handleStepTwo(page: Page, id: string) {
  // Премини от стъпка 3 към 4
  // eslint-disable-next-line no-console
  await page.waitForSelector('#ARTICLE-CONTENT > div > fieldset:nth-child(2) > div > div > p');

  setTimeout(async () => {
    await page.locator('#PAGE-NAV > nav > ul > li:nth-child(4) > div.nav-item-title > button').click();
    await initiateScreenShot(page, `${id}/mvr-step2.jpeg`);
    await page.locator('#PAGE-NAV > nav > ul > li:nth-child(4) > div.nav-item-title > button').click();
  }, 1000);
}

export async function handleStepThree(page: Page, id: string) {
  await page.waitForSelector('input[type="checkbox"]');
  const checkboxes = await page.$$('input[type="checkbox"]');

  // Loop through each checkbox and click if not checked
  setTimeout(async () => {
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.evaluate(input => input.checked);
      if (!isChecked) {
        await checkbox.click();
      }
    }
  }, 200);

  // Wait until all checkboxes are checked
  await page.waitForFunction(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    return checkboxes.length > 0 && checkboxes.every(input => (input as HTMLInputElement).checked);
  });

  await initiateScreenShot(page, `${id}/mvr-step3.jpeg`);

  // Proceed to click the next button
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(5) > div.nav-item-title > button').click();
}

export async function handleStepFour(page: Page, entry: IEntry) {
  // Прикачване на файл за придобиване
  // Step 1: Click on the desired option by its text or data-key

  if (entry.purchaseDoc) {
    await page.evaluate(() => {
      const input = document.querySelector('#documentTypeID') as HTMLInputElement;
      input?.focus();
      input?.click();
    });

    // Step 2: Wait for the dropdown list items to appear
    await page.waitForSelector('.auto-complete-options li');
    await page.locator('ul.auto-complete-options li[data-key="1043"]').click();

    // Път към файл фактура за придобиване
    const filePathBuyout = path.resolve(`./src/files/${entry.purchaseDoc}`);
    // Натисни върху бутон за прикачване на файлове.
    const fileInput = await page.waitForSelector('input.dz-hidden-input');
    // Прикачи файла
    fileInput?.uploadFile(filePathBuyout);

    await page.waitForSelector('.ui-icon.ui-icon-download-color.mr-1');

    await initiateScreenShot(page, `${entry.id}/mvr-step41.jpeg`);
  }
  // Прикачване на файл с пълномощно
  // Step 1: Click on the desired option by its text or data-key
  if (entry.powerAttorney) {
    await page.evaluate(() => {
      const input = document.querySelector('#documentTypeID') as HTMLInputElement;
      input?.focus();
      input?.click();
    });

    // Step 2: Wait for the dropdown list items to appear
    await page.waitForSelector('.auto-complete-options li');
    await page.locator('ul.auto-complete-options li[data-key="1002"]').click();

    // Избери път към файл с пълнонмощно
    const filePathTrustDeed = path.resolve(`./src/files/${entry.powerAttorney}`);
    const fileInput2 = await page.waitForSelector('input.dz-hidden-input');
    // Прикачи файла
    fileInput2?.uploadFile(filePathTrustDeed);

    // Изчакай да се прикачи вторият файл.
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll('.ui-icon.ui-icon-download-color.mr-1');
      return elements.length >= 2;
    });

    await initiateScreenShot(page, `${entry.id}/mvr-step42.jpeg`);
  }

  // Отиди на втора стъпка
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(2) > div.nav-item-title > button').click();
}

export async function handleStepFive(page: Page, entry: IEntry) {
  // Стъпка 2.
  // Избери регион за който се отнася регистрацията
  await page.waitForSelector('#circumstances_issuingPoliceDepartment\\.policeDepartmentCode');
  await page.select('#circumstances_issuingPoliceDepartment\\.policeDepartmentCode', '365');

  await page.select('#circumstances_aiskatVehicleTypeCode', '8403');

  await initiateScreenShot(page, `${entry.id}/mvr-step51.jpeg`);

  // Избери отваряне на модал за селектиране на регистрационен номер
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(4) > div.row > div > div > div.form-group.col-auto > button').click();

  // Попълни номера, който търсиш
  await page.waitForSelector('#fourDigitsCriteria_specificRegNumber');
  await page.locator('#fourDigitsCriteria_specificRegNumber').fill(entry.regNumber);

  // Натисни бутона Търси
  await page.locator('body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > div.search-box.search-box--report > fieldset > div.card-footer > div > div.right-side > button').click();

  // Изчакай за намерени резултати
  await page.waitForSelector('body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > fieldset > legend');

  await initiateScreenShot(page, `${entry.id}/mvr-step52.jpeg`);

  // При намерен резултат, затвори модала
  await page.locator('body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-footer > div > div.right-side > button').click();

  await page.waitForSelector('.modal', {hidden: true});

  await page.locator('#circumstances_agreementToReceiveERefusal').click();

  // Отиди към последна стъпка
  await page.locator('#ARTICLE-CONTENT > div > div > div.right-side > button.btn.btn-secondary').click();
}