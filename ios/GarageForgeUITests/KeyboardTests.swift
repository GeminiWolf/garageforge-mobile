import XCTest

final class KeyboardTests: XCTestCase {
  func testBudgetContextAndCapDraft() {
    continueAfterFailure = false
    let app = XCUIApplication()
    app.launchEnvironment["GARAGEFORGE_UI_TEST"] = "1"
    app.launch()
    XCTAssertTrue(app.buttons["vehicle-ui-test"].waitForExistence(timeout: 30))
    app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Budget, tab'")).firstMatch.tap()
    XCTAssertTrue(app.staticTexts["Available after commitments"].waitForExistence(timeout: 10) || app.staticTexts["Set your monthly cap"].exists)
    XCTAssertTrue(app.staticTexts["Parts to buy · Priority first"].exists)
    app.buttons["edit-monthly-cap"].tap()
    XCTAssertTrue(app.buttons["Save cap"].waitForExistence(timeout: 10))
    XCTAssertTrue(app.buttons["Cancel"].exists)
    app.buttons["Cancel"].tap()
    XCTAssertFalse(app.buttons["Save cap"].exists)
    let attachment = XCTAttachment(screenshot: app.screenshot())
    attachment.name = "Budget overview"
    attachment.lifetime = .keepAlways
    add(attachment)
    app.terminate()
  }

  func testFocusedFieldsRemainAboveKeyboard() {
    continueAfterFailure = false
    let app = XCUIApplication()
    app.launchEnvironment["GARAGEFORGE_UI_TEST"] = "1"
    app.launch()
    XCTAssertTrue(app.buttons["vehicle-ui-test"].waitForExistence(timeout: 30))
    app.buttons["vehicle-ui-test"].tap()
    app.buttons["Add part"].firstMatch.tap()
    app.buttons["Can’t find it? Enter it manually"].tap()
    let notes = app.textViews["part-notes"]
    XCTAssertTrue(notes.waitForExistence(timeout: 10))
    notes.tap()
    XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
    let save = app.buttons["Save to this build"]
    let visible = NSPredicate { _, _ in
      app.keyboards.firstMatch.frame.height > 100 && notes.isHittable && save.isHittable && notes.frame.maxY <= save.frame.minY + 1 && save.frame.maxY <= app.keyboards.firstMatch.frame.minY + 1
    }
    expectation(for: visible, evaluatedWith: app)
    waitForExpectations(timeout: 10)
    let attachment = XCTAttachment(screenshot: app.screenshot())
    attachment.name = "Focused notes above keyboard"
    attachment.lifetime = .keepAlways
    add(attachment)
    notes.typeText("Check fitment")
    // Switch to another field with the keyboard already open.
    app.scrollViews.firstMatch.swipeDown()
    let name = app.textFields["part-name"]
    name.tap()
    expectation(for: NSPredicate { _, _ in name.isHittable && name.frame.maxY <= save.frame.minY + 1 }, evaluatedWith: app)
    waitForExpectations(timeout: 10)
    app.terminate()
  }
}
