document.addEventListener("DOMContentLoaded", () => {
  const inp = document.querySelector("#inp");
  const btn = document.querySelector("#btn");
  const boxes = document.querySelectorAll(".box");

  // استرجاع القيم المخزنة في localStorage عند تحميل الصفحة
  function loadBoxTitles() {
    boxes.forEach((box, index) => {
      const title = localStorage.getItem(`box${index + 1}`);
      if (title) {
        const inputTitle = box.querySelector(".box-title");
        inputTitle.value = title;
      }
    });
  }

  // استرجاع العناصر المخزنة في localStorage عند تحميل الصفحة
  function loadItems() {
    const allItems = JSON.parse(localStorage.getItem("items")) || [];
    allItems.forEach((item) => {
      addItem(item.text, item.boxIndex, false);
    });
  }

  loadBoxTitles();
  loadItems();

  btn.onclick = (e) => {
    e.preventDefault();
    addItemIfValid();
  };

  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItemIfValid();
    }
  });

  inp.addEventListener("input", () => {
    if (inp.value !== "") {
      btn.classList.add("active");
      btn.style.backgroundColor = "#7463ff";
    } else {
      btn.classList.remove("active");
      btn.style.backgroundColor = "";
    }
  });

  function addItemIfValid() {
    const value = inp.value.trim();
    if (value !== "") {
      addItem(value, 0, true);
      inp.value = "";
      btn.classList.remove("active"); // إعادة تعيين الزر بعد الإضافة
    }
  }

  function addItem(text, boxIndex, isNew) {
    const item = document.createElement("div");
    item.className = "item-container";

    const itemText = document.createElement("p");
    itemText.textContent = text;
    itemText.className = "item";
    itemText.draggable = true;

    const editBtn = document.createElement("button");
    editBtn.className = "edit-item-btn";
    editBtn.innerHTML = "✏️";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "🗑️";

    deleteBtn.addEventListener("click", () => {
      item.remove();
      updateLocalStorage();
    });

    item.appendChild(deleteBtn);
    item.appendChild(itemText);
    item.appendChild(editBtn);

    const targetBox = boxes[boxIndex];
    const container = targetBox.querySelector(".container");

    container.appendChild(item);

    initializeDragEvents(item);
    initializeTouchEvents(item);
    initializeItemEditEvents(item);

    // حفظ العناصر في localStorage
    updateLocalStorage();
  }

  function initializeItemEditEvents(item) {
    const editButton = item.querySelector(".edit-item-btn");
    const itemText = item.querySelector(".item");

    const saveChanges = () => {
      itemText.removeAttribute("contenteditable");
      editButton.textContent = "✏️";
      updateLocalStorage();
      document.removeEventListener("click", handleClickOutside);
    };

    const handleClickOutside = (e) => {
      if (
        !item.contains(e.target) &&
        itemText.hasAttribute("contenteditable")
      ) {
        saveChanges();
      }
    };

    editButton.addEventListener("click", () => {
      if (itemText.hasAttribute("contenteditable")) {
        saveChanges();
      } else {
        itemText.setAttribute("contenteditable", "true");
        itemText.style.cursor = "auto";
        itemText.focus();
        editButton.textContent = "👍";
        document.addEventListener("click", handleClickOutside);
      }
    });

    itemText.addEventListener(
      "blur",
      () => {
        if (itemText.hasAttribute("contenteditable")) {
          saveChanges();
        }
      },
      { once: true }
    );
  }

  function initializeDragEvents(item) {
    let drag = null;

    item.addEventListener("dragstart", () => {
      drag = item;
      item.style.opacity = "0.5";
    });

    item.addEventListener("dragend", () => {
      drag = null;
      item.style.opacity = "1";
    });

    boxes.forEach((box) => {
      const input = box.querySelector("input");
      const container = box.querySelector(".container");
      box.addEventListener("dragover", (e) => {
        e.preventDefault();
        box.style.backgroundColor = box.getAttribute("data-bg-color");
        input.style.backgroundColor = box.getAttribute("data-bg-color");
        box.style.color = "#fff";
      });

      box.addEventListener("dragleave", () => {
        box.style.backgroundColor = "#fff";
        input.style.backgroundColor = "#fff";
        box.style.color = "#000";
      });

      box.addEventListener("drop", () => {
        if (drag) {
          container.appendChild(drag);
          box.style.backgroundColor = "#fff";
          input.style.backgroundColor = "#fff";
          box.style.color = "#000";

          // تحديث لون العنصر بناءً على الصندوق الذي تم إسقاطه فيه
          drag.querySelector("p").style.backgroundColor =
            box.getAttribute("data-bg-color");

          // تحديث موقع العنصر في localStorage
          updateLocalStorage();
        }
      });
    });
  }

  function initializeTouchEvents(item) {
    let initialX, initialY;
    let drag = null;
    let clone;
    let isDragging = false;

    item.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = item.getBoundingClientRect();
      initialX = touch.clientX - rect.left;
      initialY = touch.clientY - rect.top;

      // التحقق من الضغط على أزرار التعديل أو الحذف
      const target = e.target;
      if (
        target.classList.contains("edit-item-btn") ||
        target.classList.contains("delete-btn")
      ) {
        isDragging = false; // لا تسحب إذا كانت النقرة على أزرار التعديل أو الحذف
        // التعامل مع زر التعديل
        if (target.classList.contains("edit-item-btn")) {
          initializeItemEditEvents(item);
        }
        // التعامل مع زر الحذف
        if (target.classList.contains("delete-btn")) {
          item.remove();
          updateLocalStorage();
        }
        return;
      }

      drag = item;
      drag.style.opacity = "0.5";

      // إنشاء نسخة عائمة من العنصر المسحوب
      clone = item.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.width = `${item.offsetWidth - 5}px`;
      clone.style.height = `${item.offsetHeight - 5}px`;
      clone.style.transform = "scale(0.9)";
      clone.style.left = `${e.clientX - initialX}px`;
      clone.style.top = `${e.clientY - initialY}px`;
      clone.style.pointerEvents = "none";
      clone.style.opacity = "0.7";
      clone.style.zIndex = "1000";
      clone.style.backgroundColor =
        window.getComputedStyle(item).backgroundColor;
      document.body.appendChild(clone);

      isDragging = true; // تعيين حالة السحب
    });

    item.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (!drag || !clone || !isDragging) return;
      const touch = e.touches[0];

      // تحديث موقع النسخة العائمة
      clone.style.left = `${touch.clientX - initialX}px`;
      clone.style.top = `${touch.clientY - initialY}px`;

      // التحقق من مرور العنصر فوق صندوق آخر
      boxes.forEach((box) => {
        const boxRect = box.getBoundingClientRect();
        if (
          touch.clientX >= boxRect.left &&
          touch.clientX <= boxRect.right &&
          touch.clientY >= boxRect.top &&
          touch.clientY <= boxRect.bottom
        ) {
          box.style.backgroundColor = box.getAttribute("data-bg-color");
          box.querySelector("input").style.backgroundColor =
            box.getAttribute("data-bg-color");
          box.style.color = "#fff";
        } else {
          box.style.backgroundColor = "#fff";
          box.querySelector("input").style.backgroundColor = "#fff";
          box.style.color = "#000";
        }
      });
    });

    item.addEventListener("touchend", (e) => {
      e.preventDefault();
      if (!drag || !clone) return;
      if (!isDragging) return; // لا تقم بالتحريك إذا لم يكن العنصر يتم سحبه

      clone.remove();
      drag.style.opacity = "1";

      const touch = e.changedTouches[0];
      let droppedInBox = null;

      boxes.forEach((box) => {
        const boxRect = box.getBoundingClientRect();
        if (
          touch.clientX >= boxRect.left &&
          touch.clientX <= boxRect.right &&
          touch.clientY >= boxRect.top &&
          touch.clientY <= boxRect.bottom
        ) {
          droppedInBox = box;
        }

        // إعادة تعيين ألوان الصناديق
        box.style.backgroundColor = "#fff";
        box.querySelector("input").style.backgroundColor = "#fff";
        box.style.color = "#000";
      });

      if (droppedInBox) {
        const container = droppedInBox.querySelector(".container");
        container.appendChild(drag);

        // تحديث لون العنصر بناءً على الصندوق الذي تم إسقاطه فيه
        drag.querySelector("p").style.backgroundColor =
          droppedInBox.getAttribute("data-bg-color");

        // تحديث موقع العنصر في localStorage
        updateLocalStorage();
      }

      drag = null;
      clone = null;
      isDragging = false;
    });
  }

  function updateLocalStorage() {
    const allItems = [];
    boxes.forEach((box, boxIndex) => {
      const container = box.querySelector(".container");
      // الحصول على جميع العناصر بما في ذلك النصوص المكررة
      container.querySelectorAll(".item").forEach((item) => {
        allItems.push({ text: item.textContent, boxIndex });
      });
    });
    localStorage.setItem("items", JSON.stringify(allItems));
  }

  // التعامل مع تعديل اسم البوكس
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const inputTitle = button.previousElementSibling;
      const toggleBtn = button;

      if (inputTitle.hasAttribute("readonly")) {
        inputTitle.removeAttribute("readonly");
        inputTitle.focus();
        toggleBtn.textContent = "👍";

        const saveChanges = () => {
          inputTitle.setAttribute("readonly", "");
          toggleBtn.textContent = "✏️";
          const boxIndex =
            Array.from(boxes).indexOf(inputTitle.closest(".box")) + 1;
          localStorage.setItem(`box${boxIndex}`, inputTitle.value);
          document.removeEventListener("click", saveChanges);
        };

        inputTitle.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            saveChanges();
            e.preventDefault();
          }
        });

        document.addEventListener("click", (event) => {
          if (
            !inputTitle.contains(event.target) &&
            !button.contains(event.target)
          ) {
            saveChanges();
          }
        });
      } else {
        inputTitle.setAttribute("readonly", "");
        toggleBtn.textContent = "✏️";
        const boxIndex =
          Array.from(boxes).indexOf(inputTitle.closest(".box")) + 1;
        localStorage.setItem(`box${boxIndex}`, inputTitle.value);
      }
    });
  });
});
